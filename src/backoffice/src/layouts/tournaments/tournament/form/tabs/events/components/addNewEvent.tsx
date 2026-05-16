import Loading from 'assets/loading'
import Card from 'components/cards/card'
import InfoCard from 'components/cards/infoCard'
import DataGridV2 from 'components/uiKit/dataGridV2'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import { useState } from 'react'
import { TiInfoLargeOutline } from 'react-icons/ti'
import { useQuery } from 'react-query'
import { toastError, toastSuccess } from 'utils/functions/notifications'
import eventsApi, { eventsI } from 'utils/services/api/requests/tournament-api/events'
import { TournamentI } from 'utils/services/api/requests/tournaments/types'
import { columns } from './listSettings'

interface Props {
  currentTournament: TournamentI
}

export default function AddNewEvent(props: Props) {
  const { currentTournament } = props
  const {
    data: events,
    isLoading,
    refetch,
  } = useQuery(
    `events-jp-${currentTournament.id}`,
    () => eventsApi.eventsPerTournament(currentTournament.id),
    {},
  )
  const [loading, setLoading] = useState(false)

  function handleConfirmBind(event: eventsI) {
    setLoading(true)
    eventsApi
      .bindEventToTournamentRace({
        tournamentId: currentTournament.id,
        eventId: event.id as number,
      })
      .then(() => {
        toastSuccess(
          <Typography
            translateGroup="tournament-event"
            translateKey="event-successfully-added"
          />,
        )
        setLoading(false)
        refetch()
      })
      .catch(() => {
        toastError(
          <Typography
            translateGroup="tournament-event"
            translateKey="error-to-add-event"
          />,
        )
        setLoading(false)
        refetch()
      })
  }

  if (isLoading || loading) {
    return <Loading />
  }
  return (
    <Card
      color="secondary"
      padding={['p-3', 'pt-5']}
      style={{
        width: '600px',
        maxWidth: 'calc(100vw - 2rem)',
        maxHeight: 'calc(100dvh - 4rem)',
        overflowY: 'auto',
      }}
      animateOnScroll
      animation="zoom-in"
    >
      <Grid>
        <Typography
          translateGroup="tournament-events"
          translateKey="add-a-new-event-to-tournament"
          size="lg"
          weight={600}
          style={{
            width: '100%',
            textAlign: 'center',
          }}
        />
      </Grid>
      <InfoCard
        color="info-outline"
        icon={<TiInfoLargeOutline />}
        label={(
          <Typography
            translateGroup="infoCards"
            translateKey="what-is-a-event"
            weight={800}
            size="md"
          />
        )}
        content={(
            <Typography
            translateGroup="infoCards"
            translateKey="what-is-a-event-explained"
            weight={800}
            size="md"
            />
        )}
        contentProps={{ weight: 500, size: 'normal' }}
      />
      <Grid wrap="nowrap" gap="0.5rem">
        <DataGridV2
          data={events?.availableEvents || []}
          onRowClick={(event: eventsI) => handleConfirmBind(event)}
          pagination
          columns={columns}
        />
      </Grid>
    </Card>
  )
}
