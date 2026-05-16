import { dataGridColumnType } from 'components/uiKit/dataGridV3'

export const columns: Array<dataGridColumnType> = [
    {
        key: 'id',
        uniqueId: 'id',
        label: 'Id',
        filter: true,
    },
    {
        key: 'name',
        uniqueId: 'name',
        label: 'Name',
        filter: true,
    }
]
