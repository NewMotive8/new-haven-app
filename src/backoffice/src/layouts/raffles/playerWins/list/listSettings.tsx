import { dataGridColumnType } from 'components/uiKit/dataGridV3'
import moment from 'moment'
import Badge from 'components/badge/Badge'
import { textTranslated } from 'components/TextTranslated'
import {
  BsClock,
  BsArrowRepeat,
  BsCheckCircle,
  BsXCircle,
} from 'react-icons/bs'


type PayoutStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'

const payoutStatusConfig: Record<
  PayoutStatus,
  {
    translationKey: string
    backgroundColor: string
      icon: React.ReactNode
    iconColor: string
  }
> = {
  PENDING: {
    translationKey: 'payout-status-pending',
    backgroundColor: '#9CA3AF', // gray
    iconColor: '#FFFFFF',
    icon: <BsClock />,
  },
  PROCESSING: {
      translationKey: 'payout-status-processing',
      iconColor: '#FFFFFF',
    backgroundColor: '#3B82F6', // blue
    icon: <BsArrowRepeat />,
  },
  PAID: {
      translationKey: 'payout-status-paid',
      iconColor: '#FFFFFF',
    backgroundColor: '#22C55E', // green
    icon: <BsCheckCircle />,
  },
  FAILED: {
      translationKey: 'payout-status-failed',
      iconColor: '#FFFFFF',
    backgroundColor: '#EF4444', // red
    icon: <BsXCircle />,
  },
}

export const columns: Array<dataGridColumnType> = [
  {
    key: 'id',
    uniqueId: 'id',
    label: 'id',
    filter: true,
  },
  {
    key: 'brandPlayerId',
    uniqueId: 'brandPlayerId',
    label: 'brandPlayerId',
    filter: true,
  },
  {
    key: 'payoutAmount',
    uniqueId: 'payoutAmount',
    label: 'payoutAmount',
    filter: true,
  },
  {
    key: 'payoutStatus',
    uniqueId: 'payoutStatus',
    label: 'payoutStatus',
    filter: true,
    filterType: 'payout-status',
    render: (value: PayoutStatus) => {
      const config = payoutStatusConfig[value]

      if (!config) {
        return value
      }

      return (
        <Badge
          text={
            textTranslated({
              group: 'player-wins',
              key: config.translationKey,
            }) || value
          }
          icon={config.icon}
              backgroundColor={config.backgroundColor}
               iconColor={config.iconColor}
        />
      )
    },
  },
  {
    key: 'createdDate',
    uniqueId: 'createdDate',
    label: 'Payout Date',
    filter: true,
    filterType: 'custom',
    render: (value: any) =>
      moment.utc(value).format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    key: 'betTime',
    uniqueId: 'betTime',
    label: 'Bet Time',
    filter: true,
    filterType: 'custom',
    render: (value: any) =>
      moment.utc(value).format('YYYY-MM-DD HH:mm:ss'),
  },
]
