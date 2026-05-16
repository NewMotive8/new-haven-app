import { dataGridColumnType } from 'components/uiKit/dataGridV3'

export const columns: Array<dataGridColumnType> = [
    {
        key: 'category',
        uniqueId: 'category',
        label: 'Category',
        filter: true,
    },
    {
        key: 'locale',
        uniqueId: 'locale',
        label: 'Locale',
        filter: true,
    },
    {
        key: 'translation',
        uniqueId: 'translation',
        label: 'Translation',
        filter: true,
    },

]
