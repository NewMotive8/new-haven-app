import React, { useEffect, useState } from 'react'
import Grid from 'components/uiKit/grid'
import { textTranslated } from 'components/TextTranslated'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import { useQuery } from 'react-query'
import segmentsApi, { segmentsI } from 'utils/services/api/requests/segments'
import Loading from 'assets/loading'
import DialogContext from 'context/dialog'
import Button from 'components/uiKit/buttons'
import Typography from 'components/uiKit/typography'
import DataGridV2 from 'components/uiKit/dataGridV2'
import confirmBox from 'components/selectors/confirmBox'
import { toastError, toastSuccess } from 'utils/functions/notifications'
import { BsTrash } from 'react-icons/bs'
import { CrudContext } from '../../..'
import { FormContext } from '../..'
import AddNewSegment from './addNewSegment'

export default function SegmentsTab() {
    const {
        selectedItem,
    } = React.useContext(CrudContext)
    const {
        errors,
        updateField,
        setCurrentInfo,
    } = React.useContext(FormContext)
    const { data: segments, isLoading, refetch } = useQuery(`segments-jp-${selectedItem.id}`, () => segmentsApi.segmentsPerJackpot(selectedItem.id), {})
    const { displayDialog, removeDialog } = React.useContext(DialogContext)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (segments?.usedSegments?.length) {
            updateField('segments', segments?.usedSegments)
        }
    }, [segments])

    function handleDisplayDialog() {
        displayDialog({
            dialogId: 'ADD-SEGMENTS',
            content: (<AddNewSegment currentJackpot={selectedItem} />),
        })
    }
    function handleConfirmUnbind(segment: segmentsI) {
        confirmBox({
            confirmMessage: (
                <Typography
                    translateGroup="jackpot-segment"
                    translateKey="are-you-sure-in-remove-this-segment"
                />
            ),
            onConfirm: () => {
                setLoading(true)
                segmentsApi.unbindSegmentToJackpot({ jackpotId: selectedItem.id, segmentId: segment.id as number }).then(() => {
                    toastSuccess(
                        <Typography
                            translateGroup="jackpot-segment"
                            translateKey="segment-successfully-removed"
                        />,
                    )
                    setLoading(false)
                    refetch()
                }).catch(() => {
                    toastError(<Typography
                        translateGroup="jackpot-segment"
                        translateKey="error-to-remove-segment"
                    />)
                    setLoading(false)
                    refetch()
                })
            },
        })
    }

    if (isLoading) {
        return <Loading />
    }

    return (
        <Grid gap="0.5rem">
            <Grid>
                <Button id="add-segment-cta" onClick={() => handleDisplayDialog()}>
                    <Typography
                        translateGroup="jackpot-segments"
                        translateKey="add-a-new-segment"
                    />
                </Button>
            </Grid>
            <Grid>
                <Grid wrap="nowrap" gap="0.5rem">
                    <DataGridV2
                        data={segments?.usedSegments || []}
                        onRowClick={(segment: segmentsI) => handleConfirmUnbind(segment)}
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
                                render: (id: number, segment: segmentsI) => <BsTrash size={20} />,
                            },
                        ]}
                    />
                </Grid>
            </Grid>
        </Grid>
    )
}
