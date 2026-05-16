import { dataGridColumnType } from 'components/uiKit/dataGridV3'
import { BsCheck, BsX } from 'react-icons/bs'

export const columns: Array<dataGridColumnType> = [
  {
    label: 'name',
    key: 'name',
    uniqueId: 'name-properties',
    filter: true,
  },
  {
    label: 'value',
    key: 'value',
    uniqueId: 'value',
    filter: true,
  },
  {
    label: 'Enabled',
    key: 'enabled',
    uniqueId: 'enabled',
    render: (enabled: any, row: any) => {
      return enabled ? (
        <BsCheck fill="var(--success)" size="1.4rem" />
      ) : (
        <BsX fill="var(--danger)" size="1.4rem" />
      )
    },
    style: { maxWidth: '60px' },
  },
]
