import { dataGridColumnType } from 'components/uiKit/dataGridV3'
import { BsCheck, BsX } from 'react-icons/bs'

export const columns: Array<dataGridColumnType> = [
    {
        label: 'Enabled',
        key: 'enabled',
        uniqueId: 'enabled',
        render: (enabled: any, row: any) => {
            return enabled ? <BsCheck fill="var(--success)" /> : <BsX fill="var(--danger)" />
        },
        style: { maxWidth: '60px' },
    },
    {
        uniqueId: 'id',
        key: 'id',
        label: 'id',
        filter: true,
    },
    {
        uniqueId: 'name-products',
        key: 'name',
        label: 'name',
        filter: true,
    },
    {
        uniqueId: 'location',
        key: 'location',
        label: 'location',
        filter: true,
    },
]
