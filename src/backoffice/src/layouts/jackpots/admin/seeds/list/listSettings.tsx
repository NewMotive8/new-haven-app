import { dataGridColumnType } from 'components/uiKit/dataGridV3'

export const columns: Array<dataGridColumnType> = [
    {
        label: 'Name',
        key: 'name',
        uniqueId: 'name-seeds',
        filter: true,
    },
    {
        label: 'seed-current-amount',
        key: 'currentAmount',
        uniqueId: 'currentAmount-seeds',
        filter: true,
    },
]
