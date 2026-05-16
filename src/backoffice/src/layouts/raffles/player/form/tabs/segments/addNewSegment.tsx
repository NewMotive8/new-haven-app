import Loading from 'assets/loading'
import Card from 'components/cards/card'
import InfoCard from 'components/cards/infoCard'
import confirmBox from 'components/selectors/confirmBox'
import DataGridV2 from 'components/uiKit/dataGridV2'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import React, { useState } from 'react'
import { BsPlusCircle, BsPlusLg } from 'react-icons/bs'
import { TiInfoLargeOutline } from 'react-icons/ti'
import { useQuery } from 'react-query'
import { toastError, toastSuccess } from 'utils/functions/notifications'
import { playersI } from 'utils/services/api/requests/players'
import segmentsApi, { segmentsI } from 'utils/services/api/requests/raffle-api/segments'

interface Props {
    currentPlayer: playersI
}

export default function AddNewSegment(props: Props) {
    const { currentPlayer } = props
    const { data: segments, isLoading, refetch } = useQuery(`jpr-segments-player-${currentPlayer.id}`, () => segmentsApi.segmentsPerPlayer(currentPlayer.id), {})
    const [loading, setLoading] = useState(false)

    function handleConfirmBind(segment: segmentsI) {
        confirmBox({
            confirmMessage: (
                <Typography
                    translateGroup="jpr-player-segment"
                    translateKey="are-you-sure-in-add-this-segment"
                />
            ),
            onConfirm: () => {
                setLoading(true)
                segmentsApi.bindSegmentToPlayer({ playerId: currentPlayer.id, segmentId: segment.id as number }).then(() => {
                    toastSuccess(
                        <Typography
                            translateGroup="jpr-player-segment"
                            translateKey="segment-successfully-added"
                        />,
                    )
                    setLoading(false)
                    refetch()
                }).catch(() => {
                    toastError(<Typography
                        translateGroup="jpr-player-segment"
                        translateKey="error-to-add-segment"
                    />)
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
                    translateGroup="jpr-player-segments"
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
                label="what-is-a-segment"
                content="what-is-a-segment-explained"
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
                            render: (id: number, segment: segmentsI) => <BsPlusCircle size={20} />,
                        },
                    ]}
                />
            </Grid>
        </Card>
    )
}
