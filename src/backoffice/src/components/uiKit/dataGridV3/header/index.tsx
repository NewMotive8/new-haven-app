import React, { useContext } from 'react'
import { BsSortDownAlt, BsSortUp } from 'react-icons/bs'
import { FaSort } from 'react-icons/fa'
import Typography from 'components/uiKit/typography'
import Card from 'components/cards/card'
import { useThemeWatcher } from 'utils/customHooks'
import ToggleTheme from 'components/uiKit/toggleTheme'
import { DataGridV3Context } from '..'
import Grid from '../../grid'
import InputGroup from '../../inputs/inputGroup'
import SelectGroup from '../../inputs/selectGroup'
import DateTimeColumnFilter from 'components/datefilter/DateFilter'
import PayoutStatusColumnFilter from 'components/payoutStatusFilter/PayoutStatusColumnFilter'
import { parseExactMatchOptions } from '../utils'

export default function Header() {
  const {
    columns, filter, setFilter, sortState, setSortState,
    dataFiltered,
  } = useContext(DataGridV3Context)

  function updateFilter(key: string, value: string) {
    setFilter({ [key]: { key, value } })
  }

  function toggleSort(key: string) {
    if (sortState?.column === key) {
      const newDirection = sortState.sort === 'asc' ? 'desc' : 'asc'
      setSortState((prevState: any) => ({ ...prevState, sort: newDirection }))
    } else {
      setSortState({ column: key, sort: 'asc' })
    }
  }

  const theme = useThemeWatcher()
  return (
    <Card
      style={{
        position: 'relative',
        zIndex: '0',
        borderRadius: '4pt 4pt 0pt 0pt',
      }}
      color={theme === 'dark' ? 'primary-full' : 'primary'}
    >
      <Grid gap="0.5rem">
        <Typography
          translateGroup="list-info"
          translateKey="total-items"
        />
        <Typography weight={800}>
          {dataFiltered?.length || 0}
        </Typography>
      </Grid>
      <Grid
        gap="0.25rem"
        wrap="nowrap"
        verticalAlgin="stretch"
      >
        {columns?.map((column) => {
          const filterKey = column.key
          return (
            <Grid
              key={`header-${column.uniqueId}`}
              style={column.style}
              verticalAlgin="stretch"
            >
              <Grid
                verticalAlgin="stretch"
                wrap="nowrap"
                style={{
                  position: 'relative',
                  zIndex: '1',
                }}
              >
                <Grid>
                  {typeof column.label === 'string' ? (
                    <Typography
                      translateGroup={`input-group-label-${column.uniqueId}`}
                      translateKey={column.label}
                      size="sm"
                      color={'var(--text-color)' as any}
                    />
                  ) : (
                    column.label || ''
                  )}
                </Grid>
                {!!column.filter && (
                  <Grid width="20px">
                    {sortState?.column === filterKey ? (
                      <>
                        {sortState?.sort === 'asc' ? (
                          <BsSortDownAlt
                            color="var(--text-color)"
                            onClick={() => toggleSort(filterKey)}
                            cursor="pointer"
                          />
                        ) : (
                          <BsSortUp
                            color="var(--text-color)"
                            onClick={() => toggleSort(filterKey)}
                            cursor="pointer"
                          />
                        )}
                      </>
                    ) : (
                      <FaSort
                        onClick={() => toggleSort(filterKey)}
                        cursor="pointer"
                        color="var(--text-color)"
                      />
                    )}
                  </Grid>
                )}
              </Grid>
              <Grid
                verticalAlgin="flex-end"
                style={{
                  position: 'relative',
                  zIndex: '0',
                }}
              >
                {column.filter ? (
                  column.filterType === 'custom' ? (
                    <DateTimeColumnFilter
                      column={column}
                      value={filter?.[filterKey]?.value}
                      onChange={(val: any) => {
                        if (!val) {
                          setFilter({ [filterKey]: { key: filterKey, value: null, filterValue: null } })
                        } else {
                          setFilter({ [filterKey]: { key: filterKey, value: val.value, filterValue: val.filterValue } })
                        }
                      }}
                    />
                  ) : column.filterType === 'payout-status' ? (
                    <Grid
                      style={{
                        position: 'relative',
                        zIndex: '0',
                      }}
                    >
                      <PayoutStatusColumnFilter
                        column={column}
                        value={filter?.[filterKey]?.value}
                        onChange={(val: any) => {
                          if (!val) {
                            setFilter({ [filterKey]: { key: filterKey, value: null, filterValue: null } })
                          } else {
                            setFilter({ [filterKey]: { key: filterKey, value: val.value, filterValue: val.filterValue } })
                          }
                        }}
                      />
                    </Grid>
                  ) : column.filterExactMatch ? (
                    <Grid
                      style={{
                        position: 'relative',
                        zIndex: '0',
                      }}
                    >
                      <SelectGroup
                        id={filterKey}
                        name={filterKey}
                        value={
                          parseExactMatchOptions(column.filterExactMatch).filter(
                            (options) => options?.value?.toLowerCase() === filter?.[filterKey],
                          )[0]
                        }
                        options={parseExactMatchOptions(column.filterExactMatch)}
                        onChange={(target: any) => {
                          updateFilter(target.name, target.value)
                        }}
                      />
                    </Grid>
                  )
                   : (
                    <InputGroup
                      id={filterKey}
                      name={filterKey}
                      label=""
                      value={filter?.[filterKey] && filter[filterKey].value}
                      inputType={column.filterType || 'text'}
                      styles={{
                        marginTop: '-20px',
                      }}
                      onChange={({ target }) => {
                        updateFilter(target.name, target.value)
                      }}
                    />

                  )
                ) : (
                  <></>
                )}
              </Grid>
            </Grid>
          )
        })}
      </Grid>
    </Card>
  )
}
