import React from 'react'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import { DataGridV2Context } from '..'
import styles from './styles.module.scss'

export function getObjectData<T>(object: T, propertyString: string): any {
  const properties = propertyString.split('.')

  let value: any = object
  for (let i = 0; i < properties.length; i += 1) {
    if (Object.prototype.hasOwnProperty.call(value, properties[i])) {
      value = value[properties[i]]
    } else {
      return ''
    }
  }
  return value
}

export default function Body() {
  const {
    dataFiltered,
    columns,
    onRowClick,
    pagination,
    page,
    pageSize,
    selectedItem,
    selectedId,
  } = React.useContext(DataGridV2Context)
  const dataList = pagination
    ? dataFiltered?.slice(
        (page - 1) * pageSize,
        (page - 1) * pageSize + pageSize,
      )
    : dataFiltered
  return !dataList?.length ? (
    <div className="col-12 d-flex justify-content-center mt-5 mb-5">
      <b className="text-primary">
        <Typography
          translateGroup="global"
          translateKey="no-items-to-display"
        />
      </b>
    </div>
  ) : (
    <Grid>
      {dataList?.map((row: any, rowNumber: number) => {
        return (
          <Grid
            className={styles.row}
            data-selected={selectedId === row?.id}
            padding={['p-3', 'pt-2', 'pb-2']}
            key={`row-${rowNumber}-${row?.id}`}
            wrap="nowrap"
            gap="0.25rem"
            verticalAlgin="center"
            style={{
              borderLeft:
                selectedItem === row ? 'solid 2px var(--primary)' : 'unset',
              color: selectedItem === row ? 'var(--primary)' : 'unset',
            }}
          >
            {columns?.map((column) => {
              const value = getObjectData(row, column.key)
              return (
                <Grid
                  onClick={() => (column.avoidRowClick ? null : onRowClick && onRowClick(row))}
                  key={`${row?.id}-${column.uniqueId}`}
                  style={{
                    ...column.style,
                    cursor: column.avoidRowClick
                      ? 'unset'
                      : onRowClick
                      ? 'pointer'
                      : 'unset',
                  }}
                  {...column?.columnGridProps}
                >
                  {column.render ? (
                    column.render(value, row, rowNumber)
                  ) : column.html ? (
                    // eslint-disable-next-line react/no-danger
                    <section dangerouslySetInnerHTML={{ __html: value }} />
                  ) : (
                    <Typography>{value}</Typography>
                  )}
                </Grid>
              )
            })}
          </Grid>
        )
      })}
    </Grid>
  )
}
