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
        label: 'Operator Id',
        key: 'operatorId',
        uniqueId: 'operatorId',
        filter: true,
    },
    {
        label: 'Name',
        key: 'name',
        uniqueId: 'name-operators',
        filter: true,
    },
]
