import { dataGridColumnType } from 'components/uiKit/dataGridV3'
import Typography from 'components/uiKit/typography'

export const columns: Array<dataGridColumnType> = [
    {
        key: 'group',
        uniqueId: 'group',
        label: 'group',
        filter: true,
    },
    {
        key: 'locale',
        uniqueId: 'locale',
        label: 'Locale',
        filter: true,
    },
    {
        key: 'key',
        uniqueId: 'key',
        label: 'key',
        filter: true,
    },
    {
        key: 'value',
        uniqueId: 'value',
        label: 'value',
        filter: true,
    },
]
