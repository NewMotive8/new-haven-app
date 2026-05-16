import { textTranslated } from 'components/TextTranslated'
import { toastError, toastInfo, toastSuccess } from 'utils/functions/notifications'
import { externalDialogCall } from 'context/dialog'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import Button from 'components/uiKit/buttons'
import { pageableProps } from 'utils/services/api/types'
import { api } from 'utils/services/api'
import urls from 'utils/services/api/urls'

export interface eventsI {
    id: number | null | undefined
    brand: Object
    name: string
    eventId: string
    contributionWeight?: number | null
}

const defaultItem: eventsI = {
    id: undefined,
    name: '',
    brand: {},
    eventId: '',
    contributionWeight: 1,
}

function getItems(params?: pageableProps) {
    return api.get(urls.RF.events.getAll, { params }).then((res) => ({ content: res.data }))
}

async function eventsPerRaffle(raffleId: number) {
    const res = await api.get(urls.RF.events.eventsPerRaffle.replace('{{raffleId}}', `${raffleId}`))
    return (res?.data?.content || res?.data || [])
}

interface bindUnbind {
    raffleId: number
    eventId: number
}

async function bindEventToRaffle({ raffleId, eventId }: bindUnbind) {
    return api.get(urls.RF.events.bindToRaffle
        .replace('{{raffleId}}', `${raffleId}`)
        .replace('{{eventId}}', `${eventId}`))
        .then((res) => ({ content: res.data }))
}

async function unbindEventToRaffle({ raffleId, eventId }: bindUnbind) {
    return api.get(urls.RF.events.unbindToRaffle
        .replace('{{raffleId}}', `${raffleId}`)
        .replace('{{eventId}}', `${eventId}`))
        .then((res) => ({ content: res.data }))
}

interface deleteItemI {
    id: number | string
    successCallBack?: Function
    errorCallBack?: Function
}

async function handleConfirmDelete({ id, successCallBack, errorCallBack }: deleteItemI) {
    await api.delete(`${urls.RF.events.delete}/${id}`).then((res) => {
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
    successCallBack?: Function
    errorCallBack?: Function
    silent?: boolean
}
function toEventPayload(formData: eventsI) {
    return {
        id: formData?.id,
        brand: formData?.brand,
        name: formData?.name,
        eventId: formData?.eventId,
        contributionWeight: formData?.contributionWeight ?? 1,
    }
}

async function submitForm(formData: eventsI, options?: submitFormOptions) {
    const { errorCallBack, successCallBack, silent } = options || {}
    const action = formData?.id ? api.put : api.post
    const url = formData?.id ? `${urls.RF.events.update}/${formData.id}` : urls.RF.events.create
    const payload = toEventPayload(formData)
    await action(url, payload).then((res) => {
        if (successCallBack) {
            successCallBack(res?.data)
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

const eventsApi = {
    defaultItem,
    deleteItem,
    submitForm,
    getItems,
    eventsPerRaffle,
    bindEventToRaffle,
    unbindEventToRaffle,
}

export default eventsApi
