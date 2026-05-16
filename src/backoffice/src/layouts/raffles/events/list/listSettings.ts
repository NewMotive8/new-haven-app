import { dataGridColumnType } from 'components/uiKit/dataGridV3'

export const columns: Array<dataGridColumnType> = [
    {
        uniqueId: 'eventId',
        key: 'eventId',
        label: 'id',
        filter: true,
    },
    {
        uniqueId: 'name-events',
        key: 'name',
        label: 'name',
        filter: true,
    },
    {
        uniqueId: 'raffleName',
        key: 'raffle.name',
        label: 'raffle-name',
        filter: true,
    } 
]
