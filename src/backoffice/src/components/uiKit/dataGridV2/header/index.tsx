import React, { useContext } from 'react'
import { BsSortDownAlt, BsSortUp } from 'react-icons/bs'
import { FaSort } from 'react-icons/fa'
import Typography from 'components/uiKit/typography'
import Card from 'components/cards/card'
import { useThemeWatcher } from 'utils/customHooks'
import { DataGridV2Context } from '..'
import Grid from '../../grid'
import InputGroup from '../../inputs/inputGroup'
import SelectGroup from '../../inputs/selectGroup'

function parseExactMatchOptions(sentences: string) {
  const options = sentences.split(',').map((item: string) => ({ value: item, label: item }))
  return [{ value: '', label: 'No Filter' }, ...options]
}

export default function Header() {
  const {
    dataFiltered,
    columns,
    filter,
    setFilter,
    sortState,
    setSortState,
    additionalHeaderInfo,
  } = useContext(DataGridV2Context)

  function updateFilter(key: string, value: string) {
    setFilter((current: any) => ({ ...current, [key]: value }))
  }

  function toggleSort(key: string) {
    if (sortState?.column === key) {
      if (sortState?.sort === 'asc') {
        setSortState((cs: any) => ({ ...cs, sort: 'desc' }))
      } else {
        setSortState((cs: any) => ({ ...cs, sort: 'asc' }))
      }
    } else {
      setSortState(() => ({ column: key, sort: 'asc' }))
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
        {
          additionalHeaderInfo && (
            <Grid>
              {additionalHeaderInfo}
            </Grid>
          )
        }
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
                      translateGroup="input-group-label"
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
                  column.filterExactMatch ? (
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
                        onChange={({ target }: any) => {
                          updateFilter(filterKey, target.value)
                        }}
                      />
                    </Grid>
                  ) : (
                    <InputGroup
                      id={filterKey}
                      name={filterKey}
                      label=""
                      // value={filter}
                      value={filter?.[filterKey] && filter[filterKey].value}
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
  // return (
  //     <Grid
  //         gap="0.25rem"
  //         wrap="nowrap"
  //         verticalAlgin="stretch"
  //         style={{
  //             position: 'relative',
  //             zIndex: '0',
  //         }}
  //     >
  //         {
  //             columns?.map((column) => {
  //                 const filterKey = column.key
  //                 return (
  //                     <Grid key={`header-${column.uniqueId}`} style={column.style} verticalAlgin="stretch">
  //                         <Grid
  //                             verticalAlgin="stretch"
  //                             wrap="nowrap"
  //                             style={{
  //                                 position: 'relative',
  //                                 zIndex: '1',
  //                             }}
  //                         >
  //                             <Grid>
  //                                 {
  //                                     typeof column.label === 'string'
  //                                         ? (
  //                                             <Typography
  //                                                 translateGroup="input-group-label"
  //                                                 translateKey={column.label}
  //                                                 size="sm"
  //                                             />
  //                                         )
  //                                         : column.label || ''
  //                                 }
  //                             </Grid>
  //                             {column.filter && (
  //                             <Grid width="20px">
  //                                 {
  //                                     sortState?.column === column.key ? (
  //                                         <>

  //                                             {
  //                                                 sortState?.sort === 'asc'
  //                                                     ? <BsSortDownAlt color="var(--primary)" onClick={() => toggleSort(column.key)} cursor="pointer" />
  //                                                     : <BsSortUp color="var(--primary)" onClick={() => toggleSort(column.key)} cursor="pointer" />
  //                                             }
  //                                         </>
  //                                     )
  //                                         : <FaSort onClick={() => toggleSort(column.key)} cursor="pointer" />
  //                                 }
  //                             </Grid>
  //                             )}
  //                         </Grid>
  //                         <Grid
  //                             verticalAlgin="flex-end"
  //                             style={{
  //                                 position: 'relative',
  //                                 zIndex: '0',
  //                             }}
  //                         >
  //                             {
  //                                 column.filter
  //                                     ? column.filterExactMatch
  //                                         ? (
  //                                             <Grid
  //                                                 style={{
  //                                                     position: 'relative',
  //                                                     zIndex: '0',
  //                                                 }}
  //                                             >
  //                                                 <SelectGroup
  //                                                     id={filterKey}
  //                                                     name={filterKey}
  //                                                     value={parseExactMatchOptions(column.filterExactMatch).filter((options) => options?.value?.toLowerCase() === filter)[0]}
  //                                                     options={parseExactMatchOptions(column.filterExactMatch)}
  //                                                     onChange={(target: any) => {
  //                                                         updateFilter(target.name, target.value)
  //                                                     }}
  //                                                 />
  //                                             </Grid>
  //                                         )
  //                                         : (
  //                                             <InputGroup
  //                                                 id={filterKey}
  //                                                 name={filterKey}
  //                                                 label=""
  //                                                 value={filter && filter[filterKey]}
  //                                                 styles={{
  //                                                     marginTop: '-20px',
  //                                                 }}
  //                                                 onChange={({ target }) => { updateFilter(target.name, target.value) }}
  //                                             />
  //                                         )
  //                                     : (
  //                                         <></>
  //                                     )
  //                             }
  //                         </Grid>
  //                     </Grid>
  //                 )
  //             })
  //         }
  //     </Grid>
  // )
}
