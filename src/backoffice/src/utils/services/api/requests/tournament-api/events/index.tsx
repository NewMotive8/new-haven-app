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
    contributionWeight: 0,
}

function getItems(params?: pageableProps) {
    return api.get(urls.TR.events.getAll, { params }).then((res) => ({ content: res.data }))
}
async function eventsPerTournament(tournamentId: number) {
    const res = await api.get(urls.TR.events.eventsPerTournament.replace('{{tournamentId}}', `${tournamentId}`))
    return (res?.data?.content || res?.data || [])
}
interface bindUnbind {
    tournamentId: number,
    eventId: number,
}
async function bindEventToTournamentRace({ tournamentId, eventId }: bindUnbind) {
    return api.get(urls.TR.events.bindToTournamentRace
        .replace('{{tournamentId}}', `${tournamentId}`)
        .replace('{{eventId}}', `${eventId}`))
        .then((res) => ({ content: res.data }))
}
async function unbindEventToTournamentRace({ tournamentId, eventId }: bindUnbind) {
    return api.get(urls.TR.events.unbindToTournamentRace
        .replace('{{tournamentId}}', `${tournamentId}`)
        .replace('{{eventId}}', `${eventId}`))
        .then((res) => ({ content: res.data }))
}
interface deleteItemI {
    id: number | string,
    successCallBack?: Function,
    errorCallBack?: Function
}

async function handleConfirmDelete({ id, successCallBack, errorCallBack }: deleteItemI) {
    await api.delete(`${urls.TR.events.delete}/${id}`).then((res) => {
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
async function submitForm(formData: eventsI, options?: submitFormOptions) {
    const { errorCallBack, successCallBack, silent } = options || {}
    const action = formData?.id ? api.put : api.post
    const url = formData?.id ? `${urls.TR.events.update}/${formData.id}` : urls.TR.events.create
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

const eventsApi = {
    defaultItem,
    deleteItem,
    submitForm,
    getItems,
    eventsPerTournament,
    bindEventToTournamentRace,
    unbindEventToTournamentRace,
}

export default eventsApi
