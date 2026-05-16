import { dataGridColumnType } from 'components/uiKit/dataGridV3'

export const columns: Array<dataGridColumnType> = [
    {
        key: 'id',
        uniqueId: 'id',
        label: 'Id',
        filter: true,
    },
    {
        key: 'brandPlayerId',
        uniqueId: 'brandPlayerId',
        label: 'brandPlayerId',
        filter: true,
    }
]
