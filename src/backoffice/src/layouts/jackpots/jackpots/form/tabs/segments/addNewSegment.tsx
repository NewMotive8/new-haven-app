import Loading from 'assets/loading'
import Card from 'components/cards/card'
import InfoCard from 'components/cards/infoCard'
import confirmBox from 'components/selectors/confirmBox'
import DataGridV2 from 'components/uiKit/dataGridV2'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import React, { useState } from 'react'
import { BsPlusCircle } from 'react-icons/bs'
import { TiInfoLargeOutline } from 'react-icons/ti'
import { useQuery } from 'react-query'
import { toastError, toastSuccess } from 'utils/functions/notifications'
import { jackpotsI } from 'utils/services/api/requests/jackpots'
import segmentsApi, { segmentsI } from 'utils/services/api/requests/segments'

interface Props {
  currentJackpot: jackpotsI
}

export default function AddNewSegment(props: Props) {
  const { currentJackpot } = props
  const {
    data: segments,
    isLoading,
    refetch,
  } = useQuery(
    `segments-jackpot-${currentJackpot.id}`,
    () => segmentsApi.segmentsPerJackpot(currentJackpot.id),
    {},
  )
  const [loading, setLoading] = useState(false)

  function handleConfirmBind(segment: segmentsI) {
    confirmBox({
      confirmMessage: (
        <Typography
          translateGroup="jackpot-segment"
          translateKey="are-you-sure-in-add-this-segment"
        />
      ),
      onConfirm: () => {
        setLoading(true)
        segmentsApi
          .bindSegmentToJackpot({
            jackpotId: currentJackpot.id,
            segmentId: segment.id as number,
          })
          .then(() => {
            toastSuccess(
              <Typography
                translateGroup="jackpot-segment"
                translateKey="segment-successfully-added"
              />,
            )
            setLoading(false)
            refetch()
          })
          .catch(() => {
            toastError(
              <Typography
                translateGroup="jackpot-segment"
                translateKey="error-to-add-segment"
              />,
            )
            setLoading(false)
            refetch()
          })
      },
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
          translateGroup="jackpot-segments"
          translateKey="add-a-new-segment-to-jackpot"
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
            translateKey="what-is-a-segment"
            weight={800}
            size="md"
          />
        )}
        content={(
          <Typography
            translateGroup="infoCards"
            translateKey="what-is-a-segment-explained"
            weight={800}
            size="md"
          />
        )}
        contentProps={{ weight: 500, size: 'normal' }}
      />
      <Grid wrap="nowrap" gap="0.5rem">
        <DataGridV2
          data={segments?.availableSegments || []}
          onRowClick={(segment: segmentsI) => handleConfirmBind(segment)}
          pagination
          columns={[
            {
              key: 'name',
              uniqueId: 'name',
              label: 'name',
              filter: true,
            },
            {
              key: 'description',
              uniqueId: 'description',
              label: 'description',
              filter: true,
            },
            {
              key: 'id',
              uniqueId: 'id',
              label: '',
              style: { maxWidth: '20px' },
              render: (id: number, segment: segmentsI) => (
                <BsPlusCircle size={20} />
              ),
            },
          ]}
        />
      </Grid>
    </Card>
  )
}
