import { textTranslated } from 'components/TextTranslated'
import { toastError, toastInfo, toastSuccess } from 'utils/functions/notifications'
import { externalDialogCall } from 'context/dialog'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import Button from 'components/uiKit/buttons'
import { pageableProps } from 'utils/services/api/types'
import { api } from '../../..'
import urls from '../../../urls'
import { winI } from '../win'


export interface instanceI {
    id?: number | null | undefined
    name: string;
    notifyTime: string;
    startTime: string;
    endTime: string;
    numberOfWins: number;
    places: number;
    prizePool: number;
    state: string;
    spinSprintId: number;
    wins: winI[];
    minimumBetSize: number;
}

export type SpinSprintBulkCadence = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface SpinSprintBulkGenerateRequest {
    sourceInstanceIds: number[];
    count: number;
    cadence?: SpinSprintBulkCadence;
    timezone?: string;
    skipIfExists?: boolean;
    appendDateToName?: boolean;
}

export interface SpinSprintBulkGenerateFailure {
    sourceInstanceId: number | null;
    occurrenceIndex: number | null;
    plannedStartTime: string | null;
    message: string;
}

export interface SpinSprintBulkGenerateResponse {
    requested: number;
    created: number;
    skipped: number;
    createdInstanceIds: number[];
    failures: SpinSprintBulkGenerateFailure[];
}

const defaultItem: instanceI = {
    id: undefined,
    name: '',
    notifyTime: '',
    startTime: '',
    endTime: '',
    numberOfWins: 0,
    places: 3,
    prizePool: 0,
    state: '',
    spinSprintId: 0,
    wins: [],
    minimumBetSize: 0,
};

async function getItems(params?: pageableProps) {
    return api.get(urls.JR.instance.getAll, { params }).then((res) => (res.data))
}

async function bulkGenerateSpinSprintInstances(
    request: SpinSprintBulkGenerateRequest,
): Promise<SpinSprintBulkGenerateResponse> {
    return api.post(urls.JR.instance.bulkGenerate, request).then((res) => (res.data))
}

interface deleteItemI {
    id: number | string,
    successCallBack?: Function,
    errorCallBack?: Function
}

async function handleConfirmDelete({ id, successCallBack, errorCallBack }: deleteItemI) {
    await api.delete(`${urls.JR.instance.delete}/${id}`).then((res) => {
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
async function submitForm(formData: instanceI, options?: submitFormOptions) {
    const { errorCallBack, successCallBack, silent } = options || {}
    const action = formData?.id ? api.put : api.post;
    const url = formData?.id ? `${urls.JR.instance.update}/${formData.id}` : urls.JR.instance.create;
    await action(url, formData).then((res) => {
        if (successCallBack) {
            successCallBack(res?.data as instanceI)
        }
        if (!silent) {
            const toastMessageKey = formData?.id ? 'generic-update-success' : 'generic-create-success';
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

const instanceApi = {
    defaultItem,
    deleteItem,
    submitForm,
    getItems,
    bulkGenerateSpinSprintInstances,
}

export default instanceApi
