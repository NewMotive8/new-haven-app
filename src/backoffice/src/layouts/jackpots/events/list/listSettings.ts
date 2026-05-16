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
        uniqueId: 'jackpotName',
        key: 'jackpot.internalName',
        label: 'jackpot-internal-name',
        filter: true,
    },
    {
        uniqueId: 'jackpotExternalId',
        key: 'jackpot.externalId',
        label: 'jackpot-external-id',
        filter: true,
    },
]
