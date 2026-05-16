import { dataGridColumnType } from 'components/uiKit/dataGridV3'
import moment from 'moment'

export const columns: Array<dataGridColumnType> = [
    {
        key: 'player.brandPlayerId',
        uniqueId: 'unapproved-player.brandPlayerId',
        label: 'player',
        filter: true,
    },
    {
        key: 'amountWon',
        uniqueId: 'unapproved-player.amountWon',
        label: 'amountWon',
        filter: true,
    },
    {
        uniqueId: 'jackpotName',
        key: 'jackpot.internalName',
        label: 'jackpot-internal-name',
        filter: true,
    },
    {
        uniqueId: 'winningTime',
        key: 'winningTime',
        label: 'winningTime',
        filter: true,
        filterType: 'date',
        render: (value: string) => {
            return moment.utc(value).format('DD/MM/YYYY HH:mm:ss')
        },
    },
]
