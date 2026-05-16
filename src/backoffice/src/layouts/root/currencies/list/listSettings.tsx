import { dataGridColumnType } from 'components/uiKit/dataGridV3'
import { BsCheck, BsX } from 'react-icons/bs'

export const columns: Array<dataGridColumnType> = [
  {
    label: 'name',
    key: 'name',
    filter: true,
    uniqueId: 'name-currencies',
  },
  {
    label: 'iso3',
    key: 'iso3',
    uniqueId: 'iso3',
    filter: true,
    html: true,
  },
  {
    label: 'enabled',
    key: 'enabled',
    uniqueId: 'enabled',
    style: { maxWidth: '50px' },
    render: (v: any, row: any) => (row?.enabled ? (
        <BsCheck fill="var(--success)" size="1.4rem" />
      ) : (
        <BsX fill="var(--danger)" size="1.4rem" />
      )),
  },
]
