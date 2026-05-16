/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useContext } from 'react'
import { BsArrowLeftSquare, BsArrowRightSquare } from 'react-icons/bs'
import { useQuery } from 'react-query'
import Loading from 'assets/loading'
import { useDebounce } from 'utils/customHooks'
import { pageableProps, pageableResponseI } from 'utils/services/api/types'
import dynamic from 'next/dynamic'
import { globalData } from 'pages/_app'
import BrandContext from 'context/brand'
import Grid from '../grid'
import Typography from '../typography'
import { gridProps } from '../grid/types'
import SelectGroup from '../inputs/selectGroup'
import { pageSelectorOptions, pageSizeOptions } from './selectors'

const Header = dynamic(() => import('./header'), { ssr: false })
const Body = dynamic(() => import('./body'), { ssr: false })

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
  filterType?: 'date' | 'custom' | 'payout-status'
};

interface Props {
  columns: Array<dataGridColumnType>;
  dataService: (props: pageableProps) => void;
  onRowClick?: Function;
  selectedItem?: (rowItem: any) => boolean;
  defaultPageSize?: number;
  dataGridId: string;
  enablePagination?: boolean; //
  onFilterChange?: Function;
}

export interface DataGridV3ContextInterface {
  filter: any;
  setFilter: Function;
  data: any;
  dataFiltered: any;
  columns: null | Array<dataGridColumnType>;
  onRowClick?: Function;
  pagination?: boolean;
  page: number;
  sortState: any;
  setSortState: Function;
  selectedItem?: (rowItem: any) => boolean;
}

export const DataGridV3Context = React.createContext<DataGridV3ContextInterface>({
  filter: null,
  setFilter: () => { },
  data: null,
  dataFiltered: null,
  columns: null,
  pagination: false,
  page: 0,
  sortState: null,
  setSortState: () => { },
})

function isEmptyValue(value: any): boolean {
  return (
    value === null
    || value === undefined
    || value === ''
    || (Array.isArray(value) && value.length === 0)
    || (typeof value === 'object' && Object.keys(value).length === 0)
  )
}

function isFIlterEmpty(obj: Record<string, any>): boolean {
  return Object.values(obj).every(isEmptyValue)
}

export default function DataGridV3(props: Props) {
  const {
    columns,
    dataService,
    onRowClick,
    defaultPageSize,
    selectedItem,
    dataGridId,
    enablePagination,
    onFilterChange,
  } = props
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(defaultPageSize || 20)
  const [sortState, setSortState] = React.useState<any>()
  const { brandId } = useContext(BrandContext)

  const [data, setData] = useState<any>()

  const [filter, setFilter] = React.useState<any>()
  
  const handleSetFilter = (newFilter: any) => {
    setFilter(newFilter)
    if (onFilterChange) {
      onFilterChange(newFilter)
    }
  }
  // data?.filter ? Object.keys(data.filter)?.[0] : null;
  const keysFilter = filter ? Object?.keys(filter)?.[0] : null
  function parseFilter() {
    if (keysFilter == null) {
      return ''
    }
    const column = columns.find((cl) => cl.key === filter?.[keysFilter]?.key)
    if (column?.parseFilter) {
      return `${column.filterExactMatch ? '$eq=' : '$like='}${column.parseFilter(filter?.[keysFilter]?.value)}`
    }

    return `$like=${filter?.[keysFilter]?.value}`
  }
  const filterExp = keysFilter
    ? filter?.[keysFilter]?.filterValue
      ? filter?.[keysFilter]?.filterValue
      : filter?.[keysFilter]?.value
        ? `${filter?.[keysFilter]?.key}${parseFilter()}`
        : ''
    : ''
  const debouncedFilter = useDebounce(filterExp, 500)

  useEffect(()=>{
    setPage(0)
  },[debouncedFilter])

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery(
    [
      dataGridId,
      `${page}-${size}-${sortState?.column}-${debouncedFilter}-${sortState?.sort}-${brandId}`,
    ],
    () => dataService({
      page,
      size,
      sort: sortState?.column
        ? `${sortState?.column}${sortState?.sort ? `,${sortState.sort}` : ''}`
        : '',
      filterExp: debouncedFilter,
    }),
    {
      onSuccess: (dt: any) => {
        setData(dt.content)
      },
      enabled: true,
    },
  )

  const responsePageable: pageableResponseI = response || ({} as any)

  const {
    empty, first, last, numberOfElements, totalElements, totalPages,
  } = responsePageable

  useEffect(() => {
    setPage(0)
  }, [size])

  useEffect(() => {
    refetch()
  }, [brandId])

  function nextPage() {
    setPage((current) => current + 1)
  }
  function prevPage() {
    setPage((current) => current - 1)
  }

  return (
    <DataGridV3Context.Provider
      value={{
        filter,
        setFilter: handleSetFilter,
        data,
        dataFiltered: data,
        columns,
        onRowClick,
        page,
        sortState,
        setSortState,
        selectedItem,
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
        {isLoading && (
          <Grid padding={['p-5']}>
            <Loading />
          </Grid>
        )}

        {/* hide pagination until v2 */}
        <Grid
          hidden={!enablePagination}
          horizontalAlgin="space-between"
          padding={['p-3']}
          verticalAlgin="stretch"
        >
          <Grid gap="0.5rem" wrap="nowrap" width={33} verticalAlgin="center">
            <Typography
              translateGroup="global"
              translateKey="total-items"
              weight={600}
            />
            {totalElements}
            <Grid width="100px" verticalAlgin="center">
              <SelectGroup
                id={`${dataGridId}-page-size`}
                label={'' as any}
                name={`${dataGridId}-page-size`}
                options={pageSizeOptions}
                value={pageSizeOptions.filter((item) => item.value === size)}
                onChange={({ target }: any) => setSize(target.value)}
              />
            </Grid>
          </Grid>
          <Grid
            gap="0.5rem"
            wrap="nowrap"
            width={33}
            verticalAlgin="center"
            horizontalAlgin="center"
          >
            <Typography
              translateGroup="global"
              translateKey="items-in-view"
              weight={600}
            />
            {numberOfElements}
          </Grid>
          <Grid
            horizontalAlgin="flex-end"
            width={33}
            verticalAlgin="center"
            gap="0.25rem"
          >
            <BsArrowLeftSquare
              size={25}
              cursor={first ? 'unset' : 'pointer'}
              color={first ? 'rgba(255,255,255,0.25)' : 'unset'}
              onClick={() => {
                if (!first) prevPage()
              }}
            />
            <Grid width="100px" horizontalAlgin="center" verticalAlgin="center">
              <SelectGroup
                id={`${dataGridId}-page`}
                label={'' as any}
                name={`${dataGridId}-page`}
                options={pageSelectorOptions(totalPages)}
                value={pageSelectorOptions(totalPages).filter(
                  (item) => item.value === page,
                )}
                onChange={({ target }: any) => setPage(target.value)}
              />
            </Grid>
            <BsArrowRightSquare
              size={25}
              color={!last ? 'unset' : 'rgba(255,255,255,0.25)'}
              onClick={() => {
                if (!last) nextPage()
              }}
              cursor={!last ? 'pointer' : 'unset'}
            />
          </Grid>
        </Grid>
      </Grid>
    </DataGridV3Context.Provider>
  )
}
