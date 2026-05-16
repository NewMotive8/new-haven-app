import { dataGridColumnType } from 'components/uiKit/dataGridV3'

export const columns: Array<dataGridColumnType> = [
    {
        uniqueId: 'name-segments',
        key: 'name',
        label: 'name',
        filter: true,
    },
    {
        uniqueId: 'description',
        key: 'description',
        label: 'description',
        filter: true,
    },
]
