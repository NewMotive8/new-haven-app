/* eslint-disable react/no-danger */
/* eslint-disable react/no-array-index-key */
import React from 'react'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import { DataGridV3Context } from '..'
import styles from './styles.module.scss'
import { getObjectData } from '../utils'

export default function Body() {
    const {
        dataFiltered,
        columns,
        onRowClick,
        selectedItem,
    } = React.useContext(DataGridV3Context)
    const dataList = dataFiltered
    return !dataList?.length
        ? (
            <div className="col-12 d-flex justify-content-center mt-5 mb-5">
                <b className="text-primary">
                    <Typography
                        translateGroup="global"
                        translateKey="no-items-to-display"
                    />
                </b>
            </div>
        )
        : (
            <Grid>
                {
                    dataList?.map((row: any, rowNumber: number) => {
                        return (
                            <Grid
                                className={styles.row}
                                data-is-selected={selectedItem && selectedItem(row)}
                                padding={['p-3']}
                                key={`row-${rowNumber}-${row?.id}-${Math.random()}`}
                                wrap="nowrap"
                                gap="0.25rem"
                                verticalAlgin="center"
                            >
                                {
                                    columns?.map((column) => {
                                        const value = getObjectData(row, column.key)
                                        return (
                                            <Grid
                                                onClick={() => (column.avoidRowClick ? null : onRowClick && onRowClick(row))}
                                                key={`${row?.id}-${column.uniqueId}-${Math.random()}`}
                                                style={{
                                                    ...column.style,
                                                    cursor: column.avoidRowClick ? 'unset' : onRowClick ? 'pointer' : 'unset',
                                                }}
                                                {...column?.columnGridProps}
                                            >
                                                {
                                                    column.render
                                                        ? column.render(value, row)
                                                        : column.html
                                                            ? (
                                                                <section dangerouslySetInnerHTML={{ __html: (value) }} />
                                                            )
                                                            : (
                                                                <Typography>
                                                                    {value}
                                                                </Typography>
                                                            )

                                                }
                                            </Grid>
                                        )
                                    })
                                }
                            </Grid>
                        )
                    })
                }
            </Grid>
        )
}
