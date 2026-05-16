import Loading from 'assets/loading'
import Button from 'components/uiKit/buttons'
import DataGridV2 from 'components/uiKit/dataGridV2'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import DialogContext from 'context/dialog'
import React, { useEffect, useState } from 'react'
import { useQuery } from 'react-query'
import { toastError, toastSuccess } from 'utils/functions/notifications'
import eventsApi, { eventsI } from 'utils/services/api/requests/jackpot-race-api/events'
import { FormContext } from '../..'
import { CrudContext } from '../../..'
import AddNewEvent from './components/addNewEvent'
import { columns } from './listSettings'

export default function EventsTab() {
    const {
        selectedItem,
    } = React.useContext(CrudContext)
    const {
        errors,
        updateField,
        setCurrentInfo,
    } = React.useContext(FormContext)
    const { data: events, isLoading, refetch } = useQuery(`events-jp-${selectedItem.id}`, () => eventsApi.eventsPerJackpot(selectedItem.id), {})
    const { displayDialog, removeDialog } = React.useContext(DialogContext)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (events?.usedEvents?.length) {
            updateField('events', events?.usedEvents)
        }
    }, [events])

    function handleDisplayDialog() {
        displayDialog({
            dialogId: 'ADD-EVENTS',
            content: (<AddNewEvent currentJackpot={selectedItem} />),
        })
    }
    function handleConfirmUnbind(event: eventsI) {
        setLoading(true)
        eventsApi.unbindEventToJackpotRace({ spinSprintId: selectedItem.id, eventId: event.id as number }).then(() => {
            toastSuccess(
                <Typography
                    translateGroup="jackpot-event"
                    translateKey="event-successfully-removed"
                />,
            )
            setLoading(false)
            refetch()
        }).catch(() => {
            toastError(<Typography
                translateGroup="jackpot-event"
                translateKey="error-to-remove-event"
            />)
            setLoading(false)
            refetch()
        })
    }

    if (isLoading) {
        return <Loading />
    }

    return (
        <Grid gap="0.5rem">
            <Grid>
                <Button id="add-event-cta" onClick={() => handleDisplayDialog()}>
                    <Typography
                        translateGroup="jackpot-events"
                        translateKey="add-a-new-event"
                    />
                </Button>
            </Grid>
            <Grid>
                <Grid wrap="nowrap" gap="0.5rem">
                    <DataGridV2
                        data={events?.usedEvents || []}
                        onRowClick={(event: eventsI) => handleConfirmUnbind(event)}
                        pagination
                        columns={columns}
                    />
                </Grid>
            </Grid>
        </Grid>
    )
}
