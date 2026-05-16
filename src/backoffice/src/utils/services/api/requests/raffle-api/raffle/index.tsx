import { textTranslated } from 'components/TextTranslated'
import { toastError, toastInfo, toastSuccess } from 'utils/functions/notifications'
import { externalDialogCall } from 'context/dialog'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import Button from 'components/uiKit/buttons'
import { pageableProps } from 'utils/services/api/types'
import { api } from '../../..'
import urls from '../../../urls'
import { instanceI } from '../instance'

export type RaffleRuleType = 'TURNOVER' | 'BET_COUNT' | 'EVENT_AMOUNT' | 'PURCHASE'

export interface raffleWidgetI {
  id?: number
  locale: string
  headerText?: string
  headerStyle?: string
  startText?: string
  endText?: string
  backgroundRGB?: string
  winningBackgroundRGB?: string
  winningAnimation?: string
  termsAndConditions?: string
  tcsIsLink?: boolean
}

export interface raffleI {
    id?: number | null | undefined
    name: string;
    enabled: boolean;
    brandId: number;
    externalName?: string | null
    externalId?: string | null
    ruleType?: RaffleRuleType | ''
    ticketsPerUnit?: number | null
    unitAmount?: number | null
    unitCount?: number | null
    raffleInstances?: instanceI[];
    raffleWidgets?: raffleWidgetI[]
}

const defaultItem: raffleI = {
    id: undefined,
    name: '',
    enabled: false,
    brandId: 0,
    externalName: null,
    externalId: '',
    ruleType: '',
    ticketsPerUnit: null,
    unitAmount: null,
    unitCount: null,
    raffleInstances: [],
    raffleWidgets: [],
}

function toRafflePayload(formData: raffleI) {
    return {
        id: formData?.id,
        name: formData?.name,
        enabled: formData?.enabled,
        brandId: formData?.brandId,
        externalName: formData?.externalName ?? null,
        externalId: formData?.externalId ?? '',
        ruleType: formData?.ruleType || null,
        ticketsPerUnit: formData?.ticketsPerUnit ?? null,
        unitAmount: formData?.unitAmount ?? null,
        unitCount: formData?.unitCount ?? null,
    }
}

async function getItems(params?: pageableProps) {
    return api.get(urls.RF.raffle.getAll, { params }).then((res) => res.data)
}

interface deleteItemI {
    id: number | string,
    successCallBack?: Function,
    errorCallBack?: Function
}

async function handleConfirmDelete({ id, successCallBack, errorCallBack }: deleteItemI) {
    await api.delete(`${urls.RF.raffle.delete}/${id}`).then((res) => {
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

export async function updateInstantWin(id: number, payload: any) {
  try {
    const url = `${urls.RF.win.updateInstantWin}/${id}`

    await api.put(url, payload)

    toastSuccess(
      textTranslated({
        group: 'toast-notifications',
        key: 'generic-update-success'
      })
    )

    return true
  } catch (err) {
    console.error('❌ updateInstantWin failed:', err)

    toastError(
      textTranslated({
        group: 'toast-notifications',
        key: 'generic-error-message'
      })
    )

    return false
  }
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
async function submitForm(formData: raffleI, options?: submitFormOptions) {
    const { errorCallBack, successCallBack, silent } = options || {}
    const action = formData?.id ? api.put : api.post;
    const url = formData?.id ? `${urls.RF.raffle.update}/${formData.id}` : urls.RF.raffle.create;
    const payload = toRafflePayload(formData)
    await action(url, payload).then((res) => {
        if (successCallBack) {
            successCallBack(res?.data)
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

const raffleApi = {
    defaultItem,
    updateInstantWin,
    deleteItem,
    submitForm,
    getItems,
}

export default raffleApi
