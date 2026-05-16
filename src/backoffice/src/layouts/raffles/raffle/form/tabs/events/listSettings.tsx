import { dataGridColumnType } from 'components/uiKit/dataGridV3'
import { BsTrash } from 'react-icons/bs'
import { eventsI } from 'utils/services/api/requests/raffle-api/events'

export const columns: Array<dataGridColumnType> = [
    {
        key: 'name',
        uniqueId: 'name',
        label: 'eventName',
        filter: true,
    },
    {
        key: 'eventId',
        uniqueId: 'eventId',
        label: 'eventId',
        filter: true,
    },
    {
        key: 'id',
        uniqueId: 'id',
        label: '',
        style: { maxWidth: '20px' },
        render: (id: number, event: eventsI) => <BsTrash size={20} />,
    },
]
