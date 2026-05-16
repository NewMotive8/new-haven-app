/* eslint-disable react/no-danger */
import { dataGridColumnType } from 'components/uiKit/dataGridV3'
import Typography from 'components/uiKit/typography'

export const columns: Array<dataGridColumnType> = [
    {
        key: 'key',
        label: 'translation-key',
        uniqueId: 'translation-key',
        filter: true,
        render: (value: string) => {
            return (
                <Typography
                    translateGroup="widget-content-translation-keys"
                    translateKey={value}
                />
            )
        },
    },
    {
        key: 'translation',
        label: 'translation-value',
        uniqueId: 'translation-value',
        filter: true,
        render: (value: string) => {
            return (
                <section
                    dangerouslySetInnerHTML={{ __html: value }}
                />
            )
        },
    },
]
