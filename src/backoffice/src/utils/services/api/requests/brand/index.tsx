import { textTranslated } from 'components/TextTranslated'
import {
  toastError,
  toastInfo,
  toastSuccess,
} from 'utils/functions/notifications'
import { externalDialogCall } from 'context/dialog'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import Button from 'components/uiKit/buttons'
import { pageableProps } from 'utils/services/api/types'
import { api } from '../..'
import urls from '../../urls'

interface OperatorI {
  // TODO: move this interface to appropriate service once done it
  id: number;
  name: string;
  operatorId: string;
  enabled: boolean;
  secret: string | null;
  logo: string;
  applicationKey: string | null;
  idempotentTransactions: boolean;
  returnAmountResponse: boolean;
}

interface PlanI {
  // TODO: move this interface to appropriate service once done it
  id: number;
  level: number;
  name: string;
  maximumEvents: number;
  currentEvents: number;
  resetTime: string;
}

interface TierI {
  // TODO: move this interface to appropriate service once done it
  id: number;
  name: string;
  level: number;
  maximumEvents: number;
  enabled: boolean;
}

export interface brandI {
  id: number;
  name: string;
  brandId: string;
  logo: string;
  colour: string;
  enabled: boolean;
  hasWorkflow: boolean;
  hasWithdrawApproval: boolean | null;
  hasManualWins: boolean | null;
  hasOperatorContributionOnly: boolean | null;
  defaultLocale: string | null;
  pushDelay: number;
  currency: string;
  operator?: OperatorI | null;
  operatorOnly: boolean;
  plan?: PlanI | null;
  tier?: TierI | null;
  numberOfWinsSafeguard: number;
  maximumPayoutSafeguard: number;
  minimumApprovalAmount?: number | null;
}

const defaultItem: brandI = {
  id: 0,
  name: '',
  brandId: '',
  logo: '',
  colour: '#000000', // this should be a color pick on CRUD form
  enabled: true,
  hasWorkflow: false,
  hasWithdrawApproval: null,
  hasManualWins: null,
  hasOperatorContributionOnly: null,
  defaultLocale: 'en-GB',
  pushDelay: 10,
  currency: 'USD',
  operator: null,
  plan: null,
  tier: null,
  operatorOnly: false,
  numberOfWinsSafeguard: 0,
  maximumPayoutSafeguard: 0,
  minimumApprovalAmount: null,
}

async function getItems(params?: pageableProps) {
  return api
    .get(urls.brand.getAll, { params })
    .then((res) => ({ content: res.data }))
}

interface deleteItemI {
  id: number | string;
  successCallBack?: Function;
  errorCallBack?: Function;
}

async function handleConfirmDelete({
  id,
  successCallBack,
  errorCallBack,
}: deleteItemI) {
  await api
    .delete(`${urls.brand.delete}/${id}`)
    .then((res) => {
      if (successCallBack) {
        successCallBack(res)
      }
      toastInfo(
        textTranslated({
          group: 'toast-notifications',
          key: 'generic-delete-success',
        }),
      )
      externalDialogCall.removeDialog('CONFIRM-DIALOG')
    })
    .catch((err: any) => {
      if (errorCallBack) {
        errorCallBack(err)
      }
      toastError(
        textTranslated({
          group: 'toast-notifications',
          key: 'generic-error-message',
        }),
      )
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
  successCallBack?: Function;
  errorCallBack?: Function;
  silent?: boolean;
}
async function submitForm(formData: brandI, options?: submitFormOptions) {
  const { errorCallBack, successCallBack, silent } = options || {}
  const action = formData?.id ? api.put : api.post
  const url = formData?.id
    ? `${urls.brand.update}/${formData.id}`
    : urls.brand.create
  await action(url, formData)
    .then(() => {
      if (successCallBack) {
        successCallBack()
      }
      if (!silent) {
        const toastMessageKey = formData?.id
          ? 'generic-update-success'
          : 'generic-create-success'
        toastSuccess(
          textTranslated({ group: 'toast-notifications', key: toastMessageKey }),
        )
      }
    })
    .catch(() => {
      if (errorCallBack) {
        errorCallBack()
      }
      if (!silent) {
        toastError(
          textTranslated({
            group: 'toast-notifications',
            key: 'generic-error-message',
          }),
        )
      }
    })
}

interface GSProps {
  playerId: string,
  brandId: string,
  eventId: string,
}
async function generateSignature({ playerId, brandId, eventId }: GSProps) {
  return api.get(urls.brand.generateSignature
    .replace('{{brandId}}', brandId)
    .replace('{{playerId}}', playerId)
    .replace('{{eventId}}', eventId))
}
interface VSProps {
  signature: string,
  brandId: string,
}
async function verifySignature({ signature, brandId }: VSProps) {
  return api.post(urls.brand.verifySignature.replace('{{brandId}}', brandId), { signature })
}

const brandApi = {
  defaultItem,
  deleteItem,
  submitForm,
  getItems,
  generateSignature,
  verifySignature,
}

export default brandApi
