import { textTranslated } from 'components/TextTranslated'
import { toastError, toastInfo, toastSuccess } from 'utils/functions/notifications'
import { externalDialogCall } from 'context/dialog'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import Button from 'components/uiKit/buttons'
import { pageableProps } from 'utils/services/api/types'
import { api } from '../../..'
import urls from '../../../urls'
import { tournamentRaceI } from '../tournamentRace'
export enum RuleType {
    BET = 'BET',
    BET_AMOUNT = 'BET_AMOUNT',
    WIN = 'WIN',
    WIN_AMOUNT = 'WIN_AMOUNT',
    WIN_MULTIPLIER = 'WIN_MULTIPLIER',
    LOSSES_IN_A_ROW = 'LOSSES_IN_A_ROW',
    WINS_IN_A_ROW = 'WINS_IN_A_ROW',
}

export interface ruleI {
    id?: number | null | undefined
    tournament: tournamentRaceI | undefined
    type: RuleType
    fixedPoints?: number
    multiplerPoints?: number
    maximumPointsAllowed?: number
    consecutiveCount?: number
}

const defaultRule: ruleI = {
    id: undefined,
    tournament: undefined,
    type: RuleType.BET,
    fixedPoints: 0,
    multiplerPoints: 0,
    maximumPointsAllowed: 0,
    consecutiveCount: 0,
}

/**
 * Fetch rules for a specific tournament
 */
// ...existing code...
async function getRulesByTournament(tournamentId: number) {
    try {
        const res = await api.get(
            urls.TR.rule.getAllByTournament.replace('{{tournamentId}}', `${tournamentId}`)
        )
        return res.data
    } catch (err: any) {
        // eslint-disable-next-line no-console
        console.error('getRulesByTournament ERROR', {
            url: urls.TR.rule.getAllByTournament.replace('{{tournamentId}}', `${tournamentId}`),
            status: err?.response?.status,
            responseData: err?.response?.data,
            message: err?.message,
        })
        throw err
    }
}
// ...existing code...

/**
 * Fetch rules for a specific tournament instance
 */
async function getRulesByInstance(tournamentInstanceId: number) {
    return api
        .get(urls.TR.rule.getAllByInstance.replace('{{tournamentInstanceId}}', `${tournamentInstanceId}`))
        .then((res) => res.data)
}

interface deleteRuleI {
    id: number | string
    successCallBack?: Function
    errorCallBack?: Function
}

async function handleConfirmDeleteRule({ id, successCallBack, errorCallBack }: deleteRuleI) {
    await api.delete(`${urls.TR.rule.delete}/${id}`).then((res) => {
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

async function deleteRule(props: deleteRuleI) {
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
                            onClick={() => handleConfirmDeleteRule(props)}
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
async function submitRuleForm(formData: Partial<ruleI>, options?: submitFormOptions) {
    const { errorCallBack, successCallBack, silent } = options || {}
    const action = formData?.id ? api.put : api.post
    const url = formData?.id ? `${urls.TR.rule.update}/${formData.id}` : urls.TR.rule.create
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

const ruleApi = {
    defaultRule,
    deleteRule,
    submitRuleForm,
    getRulesByTournament,
    getRulesByInstance,
}

export default ruleApi