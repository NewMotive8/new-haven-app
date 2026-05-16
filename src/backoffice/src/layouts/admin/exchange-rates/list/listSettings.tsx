import { dataGridColumnType } from 'components/uiKit/dataGridV3'

export const columns: Array<dataGridColumnType> = [
  {
    label: 'Current Rate',
    key: 'currentRate',
    filter: true,
    uniqueId: 'currentRate',
  },
  {
    label: 'Current',
    key: 'currency.iso3',
    filter: true,
    uniqueId: 'currency.iso3',
    render: (value: string, row: any) => `${value} - ${row.currency.name}`,
  },
]
