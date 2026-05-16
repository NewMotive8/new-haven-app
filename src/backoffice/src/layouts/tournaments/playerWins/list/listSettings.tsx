import { dataGridColumnType } from 'components/uiKit/dataGridV3'
import moment from 'moment';



export const columns: Array<dataGridColumnType> = [
    {
        key: 'id',
        uniqueId: 'id',
        label: 'id',
        filter: true,
    },
    {
        key: 'playerId',
        uniqueId: 'playerId',
        label: 'playerId',
        filter: true,
    },
    {
        key: 'payoutAmount',
        uniqueId: 'payoutAmount',
        label: 'payoutAmount',
        filter: true,
    },
    {
        key: 'createdDate',
        uniqueId: 'createdDate',
        label: 'createdDate',
        filter: true,
        render: (value: any) => moment.utc(value).format('YYYY-MM-DD HH:mm:ss'),
    },  {
        key: 'betTime',
        uniqueId: 'betTime',
        label: 'betTime',
        filter: true,
        render: (value: any) => moment.utc(value).format('YYYY-MM-DD HH:mm:ss'),
    }
]
