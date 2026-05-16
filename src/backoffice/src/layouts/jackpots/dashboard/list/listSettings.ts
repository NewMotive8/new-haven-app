import { dataGridColumnType } from 'components/uiKit/dataGridV3'

export const columns: Array<dataGridColumnType> = [
    {
        label: 'Jackpot Name',
        key: 'internalName',
        uniqueId: 'internalName',
        filter: true,
    },
    {
        label: 'Description',
        key: 'internalDescription',
        uniqueId: 'internalDescription',
        html: true,
        filter: true,
    },
    {
        label: 'Type',
        key: 'type',
        uniqueId: 'type',
        filter: true,
        style: { width: '150px' },
        render: (value: any) => {
            return value === '1'
                ? 'Classic'
                : value === '2'
                    ? 'Time Based'
                    : value === '3'
                        ? 'Must Drop'
                        : value
        },
    },
]
