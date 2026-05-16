import { dataGridColumnType } from 'components/uiKit/dataGridV3'

export const columns: Array<dataGridColumnType> = [
    {
        label: 'Name',
        key: 'name',
        uniqueId: 'name-pools',
        filter: true,
    },
    {
        label: 'pool-current-amount',
        key: 'currentAmount',
        uniqueId: 'currentAmount-pools',
        filter: true,
    },
]
