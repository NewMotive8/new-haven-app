import { dataGridColumnType } from 'components/uiKit/dataGridV3'

export const columns: Array<dataGridColumnType> = [
    {
        key: 'name',
        uniqueId: 'name-user',
        label: 'name',
        filter: true,
    },
    {
        key: 'email',
        uniqueId: 'email',
        label: 'email',
        filter: true,
    },
    {
        key: 'role',
        uniqueId: 'role',
        label: 'role',
        filter: true,
    },
]
