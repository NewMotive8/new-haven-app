import { dataGridColumnType } from 'components/uiKit/dataGridV3'

export const columns: Array<dataGridColumnType> = [
    {
        label: 'Name',
        key: 'name',
        filter: true,
        uniqueId: 'name',

    },
    {
        label: 'Iso3',
        key: 'iso3',
        filter: true,
        uniqueId: 'iso3',
    },
]
