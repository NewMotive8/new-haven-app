/* eslint-disable react-hooks/exhaustive-deps */
import React, { ReactNode } from 'react'
import { BsArrowLeftSquare, BsArrowRightSquare } from 'react-icons/bs'
import Grid from '../grid'
import InputGroup from '../inputs/inputGroup'
import Typography from '../typography'
import Body, { getObjectData } from './body'
import Header from './header'
import { gridProps } from '../grid/types'

export type dataGridColumnType = {
  label: string;
  key: string;
  uniqueId: string;
  filter?: boolean;
  style?: React.CSSProperties;
  render?: Function;
  avoidRowClick?: boolean;
  html?: boolean;
  parseFilter?: Function;
  filterExactMatch?: string;
  columnGridProps?: gridProps;
};

interface Props {
  columns: Array<dataGridColumnType>;
  data: any;
  onRowClick?: Function;
  selectedItem?: any;
  pagination?: boolean;
  defaultPageSize?: number;
  paginationCustomElement?: React.ReactNode;
  selectedId?: any;
  additionalHeaderInfo?: ReactNode;
}

export interface DataGridV2ContextInterface {
  filter: any;
  setFilter: Function;
  data: any;
  dataFiltered: any;
  columns: null | Array<dataGridColumnType>;
  onRowClick?: Function;
  pagination?: boolean;
  page: number;
  pageSize: number;
  sortState: any;
  setSortState: Function;
  selectedItem?: any;
  selectedId?: any;
  additionalHeaderInfo?: ReactNode;
}

export const DataGridV2Context = React.createContext<DataGridV2ContextInterface>({
  filter: null,
  setFilter: () => { },
  data: null,
  dataFiltered: null,
  columns: null,
  pagination: false,
  page: 0,
  pageSize: 20,
  sortState: null,
  setSortState: () => { },
  selectedItem: null,
})

export default function DataGridV2(props: Props) {
  const {
    columns,
    data,
    onRowClick,
    pagination,
    defaultPageSize,
    paginationCustomElement,
    selectedItem,
    selectedId,
    additionalHeaderInfo,
  } = props
  const dataKeys = Object.keys(data?.[0] ?? {})
  const initFilter = dataKeys.reduce((acc, key) => ({ ...acc, [key]: '' }), {})
  const [filter, setFilter] = React.useState(initFilter)

  const [page, setPage] = React.useState(763)
  const [pageSize, setPageSize] = React.useState(defaultPageSize || 10)
  const [sortState, setSortState] = React.useState<any>()

  const [dataFiltered, setDataFiltered] = React.useState<any>(data)

  function filterData() {
    return data?.filter((item: any) => Object.entries(filter).every(([key, value]: any) => {
      const columnSettings = columns.find((column) => column.key === key)
      const filterValue = value

      if (!value) {
        return true
      }

      const itemValue: any = getObjectData(item, key)

      if (typeof itemValue === 'boolean' && columnSettings?.parseFilter) {
        return columnSettings.parseFilter(filterValue) === itemValue
      }

      if (typeof itemValue === 'string' || typeof itemValue === 'number') {
        return (
          itemValue
            ?.toString()
            ?.toLowerCase()
            .includes(filterValue.toLowerCase())
          || (columnSettings
            && columnSettings.parseFilter
            && columnSettings
              .parseFilter(itemValue, item)
              ?.toLowerCase()
              ?.includes(filterValue.toLowerCase()))
        )
      }
      if (Array.isArray(itemValue)) {
        return itemValue.some((v) => v.toLowerCase().includes(filterValue.toLowerCase()))
      }
      if (itemValue !== null && itemValue !== undefined) {
        return itemValue
          .toString()
          .toLowerCase()
          .includes(filterValue.toLowerCase())
      }

      return false
    }))
  }

  function sortData(key: string, order: 'asc' | 'desc', dataToSort: any) {
    const sortedData = [...dataToSort].sort((a, b) => {
      const valueA = a[key]
      const valueB = b[key]

      if (valueA === valueB) {
        return 0
      }

      if (order === 'asc') {
        return valueA > valueB ? 1 : -1
      }
      return valueA < valueB ? 1 : -1
    })

    return sortedData
  }
  React.useEffect(() => { }, [sortState, data, dataFiltered])
  React.useEffect(() => {
    if (sortState?.column) {
      setDataFiltered(
        sortData(sortState?.column, sortState.sort, filterData()),
      )
    } else {
      setDataFiltered(filterData())
    }
    setPage(1)
  }, [filter, columns, data, sortState])

  function nextPage() {
    setPage((current) => current + 1)
  }
  function prevPage() {
    setPage((current) => current - 1)
  }
  return (
    <DataGridV2Context.Provider
      value={{
        filter,
        setFilter,
        data,
        dataFiltered,
        columns,
        onRowClick,
        page,
        pageSize,
        pagination,
        sortState,
        setSortState,
        selectedItem,
        selectedId,
        additionalHeaderInfo,
      }}
    >
      <Grid style={{ background: 'var(--section-bg)', borderRadius: '4pt' }}>
        <Grid
          style={{
            background: '#ffffff03',
            borderBottom: 'solid 2px #ffffff2b',
          }}
        >
          <Header />
        </Grid>
        <Grid>
          <Body />
        </Grid>
        {paginationCustomElement}
        {pagination && (
          <Grid
            horizontalAlgin="space-between"
            padding={['p-3']}
            verticalAlgin="stretch"
          >
            <Grid gap="0.5rem" wrap="nowrap" width={50} verticalAlgin="center">
              <Typography
                translateGroup="global"
                translateKey="total-items"
                weight={600}
              />
              {dataFiltered?.length}
              <Grid
                width="100px"
                style={{
                  marginTop: '-20px',
                }}
              >
                <InputGroup
                  id="pageSize"
                  name="pageSize"
                  label=""
                  value={pageSize}
                  inputType="number"
                  inputProps={{
                    min: 1,
                    max: 100,
                  }}
                  onChange={({ target }) => {
                    setPageSize(parseInt(target.value, 10))
                  }}
                />
              </Grid>
            </Grid>
            <Grid
              horizontalAlgin="flex-end"
              width={50}
              verticalAlgin="center"
              gap="0.25rem"
            >
              <BsArrowLeftSquare
                cursor={page === 1 ? 'unset' : 'pointer'}
                color={page === 1 ? 'rgba(255,255,255,0.25)' : 'unset'}
                onClick={() => {
                  if (page > 1) prevPage()
                }}
              />
              <Grid
                width="100px"
                horizontalAlgin="center"
                style={{
                  marginTop: '-20px',
                }}
              >
                <InputGroup
                  id="page"
                  name="page"
                  label=""
                  value={page}
                  inputType="number"
                  inputProps={{
                    min: 1,
                    max: dataFiltered ? dataFiltered.length / pageSize : 1,
                  }}
                  onChange={({ target }) => {
                    setPage(parseInt(target.value, 10))
                  }}
                />
              </Grid>
              <BsArrowRightSquare
                color={
                  dataFiltered
                    && page < Math.round(dataFiltered.length / pageSize)
                    ? 'unset'
                    : 'rgba(255,255,255,0.25)'
                }
                onClick={() => {
                  if (dataFiltered && page < dataFiltered.length / pageSize) nextPage()
                }}
                cursor={
                  dataFiltered
                    && page < Math.round(dataFiltered.length / pageSize)
                    ? 'pointer'
                    : 'unset'
                }
              />
            </Grid>
          </Grid>
        )}
      </Grid>
    </DataGridV2Context.Provider>
  )
}
