/* eslint-disable react/no-danger */
/* eslint-disable react/no-array-index-key */
import React, { useEffect, useState } from 'react'
import Typography from 'components/uiKit/typography'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import styles from './styles.module.scss'
import SelectGroup from '../inputs/selectGroup'

export type dataGridColumnType = {
    label: string,
    key: string | any,
    filter?: boolean,
    style?: React.CSSProperties,
    render?: Function,
    avoidRowClick?: boolean,
    html?: boolean,
    parseFilter?: Function,
    filterExactMatch?: string
}

interface Props {
    columns: Array<dataGridColumnType>,
    data: any,
    onRowClick?: Function
    selectedId?: any,
    style?: React.CSSProperties
    bodyStyle?: React.CSSProperties
}

function parseExactMatchOptions(sentences: string) {
    const options = sentences.split(',').map((item: string) => ({ value: item, label: item }))
    return [{ value: '', label: 'No Filter' }, ...options]
}

export default function DataGrid({
    columns, data, onRowClick, selectedId, style, bodyStyle,
}: Props) {
    function loadFilter() {
        const filterInitial: any = {}
        columns.map((c: any) => {
            if (c.filterInitialValue) {
                filterInitial[c.key] = c.filterInitialValue
            }
            return c
        })
        return filterInitial
    }

    const [filter, setFilter] = useState<any>(loadFilter())
    const filterKeys = typeof filter === 'object' ? Object?.keys(filter) : []

    function returnFiltered() {
        return data.filter((j: any) => {
            let test = false
            filterKeys.map((filterKey: any) => {
                const column = columns.find((col: any) => col.key === filterKey)
                const value = column?.parseFilter ? column.parseFilter(j[filterKey]) : j[filterKey]
                if (value
                    && typeof value === 'string'
                    && value.toLowerCase().includes(filter[filterKey].toLowerCase())) {
                    test = true
                    return test
                }
                if (value && value === filter[filterKey]) {
                    test = true
                    return test
                }
                test = false
                return test
            })
            return test ? j : null
        })
    }

    const dataFiltered = filterKeys.length ? returnFiltered() : typeof data === 'object' ? data : null
    const getData = (row: any, path: any) => {
        const text = path.split('.').reduce((r: any, k: any) => r?.[k], row)
        return text
    }
    const [tableDimensions, setTableDimensions] = useState({
        width: 0,
        height: 0,
    })
    const tableRef: any = React.createRef()
    const tableBodyRef: any = React.createRef()
    const selectedIdLine: any = React.createRef()
    const tableHeadRef: any = React.createRef()

    useEffect(() => {
        if (tableRef.current && !tableDimensions.width) {
            setTableDimensions({
                width: tableRef.current.clientWidth,
                height: tableRef.current.clientHeight,
            })
        }
        if (selectedId && typeof window !== 'undefined') {
            if (tableBodyRef?.current && selectedIdLine.current) {
                const line = selectedIdLine.current
                const topPos = line.offsetTop
                if (line) {
                    tableBodyRef.current.scrollTop = `${topPos - 200}`
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tableRef, selectedIdLine, tableBodyRef])
    return !data?.length
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
            <div style={style} className={` ${styles.wrapper}`}>

                <div ref={tableRef} className={styles['table-wrapper']}>
                    <table>
                        <thead ref={tableHeadRef} className={styles.thead}>
                            <tr>
                                {
                                    columns.map((c: any, i: number) => {
                                        return c.key ? (
                                            <th
                                                key={`table-head-${c.label}-${c.key}-${i}`}
                                                style={c.style || null}
                                            >
                                                {
                                                    c.filter
                                                        ? c.filterExactMatch
                                                            ? (
                                                                <div className={styles['filter-select-wrapper']}>
                                                                    <div className={styles['filter-select-label']}>
                                                                        {
                                                                            typeof c.label === 'string'
                                                                                ? (
                                                                                    <Typography
                                                                                        translateGroup="input-group-label"
                                                                                        translateKey={c.label}
                                                                                        size="sm"
                                                                                    />
                                                                                )
                                                                                : c.label
                                                                        }
                                                                    </div>
                                                                    <SelectGroup
                                                                        id={c.key}
                                                                        name={c.key}
                                                                        value={parseExactMatchOptions(c.filterExactMatch).filter((options) => options?.value?.toLowerCase() === filter)[0]}
                                                                        options={parseExactMatchOptions(c.filterExactMatch)}
                                                                        onChange={(target: any) => {
                                                                            setFilter((f: any) => {
                                                                                if (target.value) {
                                                                                    return {
                                                                                        ...f,
                                                                                        [c.key]: target.value,
                                                                                    }
                                                                                }
                                                                                const nFilter = { ...filter }
                                                                                delete nFilter[c.key]
                                                                                return setFilter(nFilter)
                                                                            })
                                                                        }}
                                                                    />
                                                                </div>
                                                            )
                                                            : (
                                                                <InputGroup
                                                                    id={c.key}
                                                                    name={c.key}
                                                                    label={c.label}
                                                                    inputProps={{
                                                                        defaultValue: c?.filterInitialValue,
                                                                    }}
                                                                    onChange={({ target }: any) => {
                                                                        setFilter((f: any) => {
                                                                            if (target.value) {
                                                                                return {
                                                                                    ...f,
                                                                                    [c.key]: target.value,
                                                                                }
                                                                            }
                                                                            const nFilter = { ...filter }
                                                                            delete nFilter[c.key]
                                                                            return setFilter(nFilter)
                                                                        })
                                                                    }}
                                                                />
                                                            )
                                                        : (
                                                            typeof c.label === 'string'
                                                                ? (
                                                                    <Typography
                                                                        translateGroup="input-group-label"
                                                                        translateKey={c.label}
                                                                        size="sm"
                                                                    />
                                                                )
                                                                : c.label
                                                        )

                                                }
                                            </th>
                                        ) : <React.Fragment key={Math.random()} />
                                    })
                                }
                            </tr>
                        </thead>
                        <tbody
                            ref={tableBodyRef}
                            style={{ width: `${tableDimensions.width}px` || '100%', ...bodyStyle }}
                        >
                            {
                                dataFiltered?.map((r: any, i: number) => {
                                    return (
                                        <tr
                                            ref={(selectedId && r.id === selectedId) ? selectedIdLine : null}
                                            id={(selectedId && r.id === selectedId) ? `item-list-to-evidence-${selectedId}` : ''}
                                            key={`table-row-${r.id}-${i}`}
                                            className={(selectedId && r.id === selectedId) ? styles['line-highlight'] : ''}
                                            style={{ width: `${tableDimensions.width}px` }}
                                        >
                                            {
                                                columns.map((c: any, index: number) => {
                                                    return c.key ? (
                                                        <td key={`table-field-${c.label}-${c.key}-${i}-${index}`}>
                                                            <div
                                                                onClick={() => (c.avoidRowClick ? null : onRowClick && onRowClick(r))}
                                                            >
                                                                {
                                                                    c.render
                                                                        ? c.render(getData(r, c.key), r)
                                                                        : c.html
                                                                            ? <section dangerouslySetInnerHTML={{ __html: (getData(r, c.key)) }} />
                                                                            : getData(r, c.key)
                                                                }
                                                            </div>
                                                        </td>
                                                    ) : <React.Fragment key={Math.random()} />
                                                })
                                            }
                                        </tr>

                                    )
                                })
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        )
}
