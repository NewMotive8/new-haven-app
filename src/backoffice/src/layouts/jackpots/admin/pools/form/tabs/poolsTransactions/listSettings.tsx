import { dataGridColumnType } from 'components/uiKit/dataGridV3'
import moment from 'moment'

export const columns: Array<dataGridColumnType> = [
  {
    label: 'Player',
    key: 'player.brandPlayerId',
    uniqueId: 'player.brandPlayerId',
    filter: true,
  },
  {
    label: 'pool current amount',
    key: 'currentAmount',
    uniqueId: 'currentAmount-poolsTransaction',
    filter: true,
  },
  {
    label: 'Amount Added',
    key: 'amountAdded',
    uniqueId: 'amountAdded',
    filter: true,
  },
  {
    label: 'Timestamp',
    key: 'timestamp',
    uniqueId: 'timestamp',
    filter: true,
    render: (value: any) => moment.utc(value).format('DD/MM/YYYY HH:mm:ss'),
    parseFilter: (value: any) => moment.utc(value).format('DD/MM/YYYY HH:mm:ss'),
  },
]
