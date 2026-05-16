import { dataGridColumnType } from 'components/uiKit/dataGridV3'
import moment from 'moment'

export const columns: Array<dataGridColumnType> = [
    {
        key: 'id',
        label: 'Id',
        uniqueId: 'id',
        filter: true,
    },
    {
        key: 'status',
        label: 'Status',
        uniqueId: 'status',
        filter: true,
    },{
        key: 'tournamentRaceInstanceId',
        label: 'tournamentRaceInstanceId',
        uniqueId: 'tournamentRaceInstanceId',
        filter: true,
    },
    {
        key: 'instantWin',
        label: 'instantWin',
        uniqueId: 'instantWin',
        filter: true,
        render: (date:string)=> moment(date).utc().format('DD/MM/YYYY HH:mm:ss'),
        filterType: 'date'
    },
]
