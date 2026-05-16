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
        uniqueId: 'contributionWeight-events',
        key: 'contributionWeight',
        label: 'contributionWeight',
        filter: true,
    },
    {
        uniqueId: 'tournamentName',
        key: 'tournamentRace.name',
        label: 'tournament-race-name',
        filter: true,
    } 
]
