import { textTranslated } from 'components/TextTranslated'
import { toastError, toastInfo, toastSuccess } from 'utils/functions/notifications'
import { externalDialogCall } from 'context/dialog'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import Button from 'components/uiKit/buttons'
import { pageableProps } from 'utils/services/api/types'
import urls from 'utils/services/api/urls'
import { api } from 'utils/services/api'

export interface segmentsI {
    id?: number | null | undefined
    name: string
    players: Array<any>
    description: string
    brand: Object
}

const defaultItem: segmentsI = {
    id: undefined,
    name: '',
    players: [],
    description: '',
    brand: {},
}

async function getItems(params?: pageableProps) {
    return api.get(urls.RF.segments.getAll, { params }).then((res) => ({ content: res.data }))
}

async function segmentsPerRaffle(raffleId: number) {
    const res = await api.get(urls.RF.segments.segmentsPerRaffle.replace('{{raffleId}}', `${raffleId}`))
    return (res?.data?.content || res?.data || [])
}
async function segmentsPerPlayer(playerId: number) {
    const res = await api.get(urls.RF.segments.segmentsPerPlayer.replace('{{playerId}}', `${playerId}`))
    return (res?.data?.content || res?.data || [])
}
interface bindUnbind {
    raffleId: number,
    segmentId: number,
}
async function bindSegmentToJackpot({ raffleId, segmentId }: bindUnbind) {
    return api.get(urls.RF.segments.bind
        .replace('{{raffleId}}', `${raffleId}`)
        .replace('{{segmentId}}', `${segmentId}`))
        .then((res) => ({ content: res.data }))
}
async function unbindSegmentToJackpot({ raffleId, segmentId }: bindUnbind) {
    return api.get(urls.RF.segments.unbind
        .replace('{{raffleId}}', `${raffleId}`)
        .replace('{{segmentId}}', `${segmentId}`))
        .then((res) => ({ content: res.data }))
}
interface bindUnbindPlayer {
    playerId: number,
    segmentId: number,
}
async function bindSegmentToPlayer({ playerId, segmentId }: bindUnbindPlayer) {
    return api.get(urls.RF.segments.bindPlayer
        .replace('{{playerId}}', `${playerId}`)
        .replace('{{segmentId}}', `${segmentId}`))
        .then((res) => ({ content: res.data }))
}
async function unbindSegmentToPlayer({ playerId, segmentId }: bindUnbindPlayer) {
    return api.get(urls.RF.segments.unbindPlayer
        .replace('{{playerId}}', `${playerId}`)
        .replace('{{segmentId}}', `${segmentId}`))
        .then((res) => ({ content: res.data }))
}

interface deleteItemI {
    id: number | string,
    successCallBack?: Function,
    errorCallBack?: Function
}

async function handleConfirmDelete({ id, successCallBack, errorCallBack }: deleteItemI) {
    await api.delete(`${urls.RF.segments.delete}/${id}`).then((res) => {
        if (successCallBack) {
            successCallBack(res)
        }
        toastInfo(textTranslated({ group: 'toast-notifications', key: 'generic-delete-success' }))
        externalDialogCall.removeDialog('CONFIRM-DIALOG')
    }).catch((err: any) => {
        if (errorCallBack) {
            errorCallBack(err)
        }
        toastError(textTranslated({ group: 'toast-notifications', key: 'generic-error-message' }))
        externalDialogCall.removeDialog('CONFIRM-DIALOG')
    })
}

async function deleteItem(props: deleteItemI) {
    externalDialogCall.displayDialog({
        dialogId: 'CONFIRM-DIALOG',
        content: (
            <Grid
                style={{
                    width: '250px',
                    maxWidth: '90vw',
                    background: 'var(--root-bg)',
                    borderRadius: '4pt',
                }}
                padding={['pt-5', 'pb-5', 'ps-3', 'pe-3']}
            >
                <Grid margin="mb-5" horizontalAlgin="center">
                    <Typography
                        weight={700}
                        size="xl"
                        translateGroup="global"
                        translateKey="are-you-sure?"
                    />
                </Grid>
                <Grid horizontalAlgin="center" margin="mb-5">
                    <Typography
                        translateGroup="global"
                        translateKey="this-will-be-permanent"
                        weight={600}
                        style={{ textAlign: 'center' }}
                    />
                </Grid>
                <Grid horizontalAlgin="space-between">
                    <Grid width={45}>
                        <Button
                            id="confirm-dialog-cancel-cta"
                            type="button"
                            block
                            onClick={() => externalDialogCall.removeDialog('CONFIRM-DIALOG')}
                            color="secondary"
                        >
                            <Typography
                                translateGroup="global"
                                translateKey="cancel"
                                weight={600}
                            />
                        </Button>
                    </Grid>
                    <Grid width={45}>
                        <Button
                            id="confirm-dialog-confirm-cta"
                            type="button"
                            block
                            onClick={() => handleConfirmDelete(props)}
                            color="primary"
                        >
                            <Typography
                                translateGroup="global"
                                translateKey="continue"
                                weight={600}
                            />
                        </Button>
                    </Grid>
                </Grid>
            </Grid>
        ),
    })
}

interface submitFormOptions {
    successCallBack?: Function,
    errorCallBack?: Function,
    silent?: boolean,
}
async function submitForm(formData: segmentsI, options?: submitFormOptions) {
    const { errorCallBack, successCallBack, silent } = options || {}
    const action = formData?.id ? api.put : api.post
    const url = formData?.id ? `${urls.RF.segments.update}/${formData.id}` : urls.RF.segments.create
    await action(url, formData).then(() => {
        if (successCallBack) {
            successCallBack()
        }
        if (!silent) {
            const toastMessageKey = formData?.id ? 'generic-update-success' : 'generic-create-success'
            toastSuccess(textTranslated({ group: 'toast-notifications', key: toastMessageKey }))
        }
    }).catch(() => {
        if (errorCallBack) {
            errorCallBack()
        }
        if (!silent) {
            toastError(textTranslated({ group: 'toast-notifications', key: 'generic-error-message' }))
        }
    })
}

const segmentsApi = {
    defaultItem,
    deleteItem,
    submitForm,
    getItems,
    segmentsPerRaffle,
    segmentsPerPlayer,
    bindSegmentToJackpot,
    unbindSegmentToJackpot,
    bindSegmentToPlayer,
    unbindSegmentToPlayer,
}

export default segmentsApi
