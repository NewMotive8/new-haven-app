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
        uniqueId: 'spinSprintName',
        key: 'spinSprint.name',
        label: 'spin-sprint-name',
        filter: true,
    } 
]
