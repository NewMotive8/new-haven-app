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
import { JackpotI, defaultJackpot } from './types'

export interface jackpotsI extends JackpotI {}

const defaultItem: jackpotsI = {
  ...defaultJackpot,
}

// -----------------------------
// GETTERS
// -----------------------------
async function getItems(params?: pageableProps) {
  return api
    .get(urls.jackpots.getAll, { params })
    .then((res) => ({ content: res.data }))
}

async function getPlayersIdOptIns(jackpotId: number) {
  return api.get(urls.jackpots.getPlayersIdOptIns.replace('{{jackpotId}}', `${jackpotId}`))
}

async function getPlayersIdOptOuts(jackpotId: number) {
  return api.get(urls.jackpots.getPlayersIdOptOut.replace('{{jackpotId}}', `${jackpotId}`))
}

async function getReport(jackpotId: number) {
  return api.get(urls.jackpots.getReportsSnap.replace('{{jackpotId}}', `${jackpotId}`))
}

async function getReportBrand(brandId: number, jackpotId?: number) {
  const config = { headers: { brandId } }
  return api
    .get(
      urls.jackpots.getReportsBrand.replace(
        '/{{jackpotId}}',
        String(`?jackpotId=${jackpotId}`),
      ),
      config,
    )
    .then((res) => ({ content: res.data }))
}

// -----------------------------
// APPROVAL LOGIC (WINS)
// -----------------------------
export const approveWin = async (id: number) => {
  return api.post(`${urls.wins.approve.replace('{{winId}}', `${id}`)}`)
}

export const rejectWin = async (id: number) => {
  return api.post(`${urls.wins.reject.replace('{{winId}}', `${id}`)}`)
}


// -----------------------------
// APPROVAL DIALOG → API → REFRESH
// -----------------------------
export function openApproveWinDialog(winId: number, onSuccess: () => void) {
  externalDialogCall.displayDialog({
    dialogId: 'APPROVE-WIN-DIALOG',
    content: (
      <Grid
        style={{
          width: '280px',
          background: 'var(--root-bg)',
          borderRadius: '4pt',
        }}
        padding={['pt-5', 'pb-5', 'ps-3', 'pe-3']}
      >
        <Grid margin="mb-5" horizontalAlgin="center">
          <Typography size="xl" weight={700}>
            Approve this win?
          </Typography>
        </Grid>

        <Grid margin="mb-5">
          <Typography style={{ textAlign: 'center' }}>
            This action will mark the win as approved.
          </Typography>
        </Grid>

        <Grid horizontalAlgin="space-between">
          <Grid width={45}>
            <Button
              block
              color="secondary"
              onClick={() => externalDialogCall.removeDialog('APPROVE-WIN-DIALOG')} id={''}            >
              Cancel
            </Button>
          </Grid>

          <Grid width={45}>
            <Button
              block
              color="primary"
              onClick={async () => {
                try {
                  await approveWin(winId)
                  toastSuccess("Win successfully approved.")
                  externalDialogCall.removeDialog('APPROVE-WIN-DIALOG')
                  onSuccess()
                } catch (e) {
                  toastError("Failed to approve win.")
                }
              } } id={''}            >
              Confirm
            </Button>
          </Grid>
        </Grid>
      </Grid>
    ),
  })
}

// -----------------------------
// DELETE ITEM
// -----------------------------
async function handleConfirmDelete({ id, successCallBack, errorCallBack }: any) {
  await api
    .delete(`${urls.jackpots.delete}/${id}`)
    .then((res) => {
      successCallBack?.(res)
      toastInfo(textTranslated({ group: 'toast-notifications', key: 'generic-delete-success' }))
      externalDialogCall.removeDialog('CONFIRM-DIALOG')
    })
    .catch((err) => {
      errorCallBack?.(err)
      toastError(textTranslated({ group: 'toast-notifications', key: 'generic-error-message' }))
      externalDialogCall.removeDialog('CONFIRM-DIALOG')
    })
}

async function deleteItem(props: any) {
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
          <Typography translateGroup="global" translateKey="are-you-sure?" size="xl" weight={700} />
        </Grid>

        <Grid margin="mb-5" horizontalAlgin="center">
          <Typography translateGroup="global" translateKey="this-will-be-permanent" />
        </Grid>

        <Grid horizontalAlgin="space-between">
          <Grid width={45}>
            <Button
              color="secondary"
              block
              onClick={() => externalDialogCall.removeDialog('CONFIRM-DIALOG')} id={''}            >
              Cancel
            </Button>
          </Grid>

          <Grid width={45}>
            <Button color="primary" block onClick={() => handleConfirmDelete(props)} id={''}>
              Continue
            </Button>
          </Grid>
        </Grid>
      </Grid>
    ),
  })
}

// -----------------------------
// FORM SUBMIT
// -----------------------------
async function submitForm(formData: jackpotsI, options?: any) {
  const { successCallBack, errorCallBack, silent } = options || {}

  const isEdit = Boolean(formData.id)
  const action = isEdit ? api.put : api.post

  const url = isEdit
    ? `${urls.jackpots.update}/${formData.id}`
    : urls.jackpots.create

  await action(url, { ...formData, id: formData.id ?? null })
    .then((res) => {
      successCallBack?.(res?.data)
      if (!silent) {
        toastSuccess(
          textTranslated({
            group: 'toast-notifications',
            key: isEdit ? 'generic-update-success' : 'generic-create-success',
          }),
        )
      }
    })
    .catch(() => {
      errorCallBack?.()
      if (!silent) {
        toastError(textTranslated({ group: 'toast-notifications', key: 'generic-error-message' }))
      }
    })
}
async function submitApproval(jackpotId: number) {
  return api.get(
    urls.jackpots.submitApproval.replace('{{jackpotId}}', `${jackpotId}`),
  )
}

async function softDelete(jackpotId: number) {
  return api.delete(`${urls.jackpots.delete}/${jackpotId}`)
}

async function approve(jackpotId: number) {
  return api.get(urls.jackpots.approve.replace('{{jackpotId}}', `${jackpotId}`))
}

async function reject(jackpotId: number) {
  return api.get(urls.jackpots.reject.replace('{{jackpotId}}', `${jackpotId}`))
}
async function enable(jackpotId: number) {
  return api.get(urls.jackpots.enable.replace('{{jackpotId}}', `${jackpotId}`))
}
async function disable(jackpotId: number) {
  return api.get(urls.jackpots.disable.replace('{{jackpotId}}', `${jackpotId}`))
}

const jackpotsApi = {
  defaultItem,
  getItems,
  getReport,
  getPlayersIdOptIns,
  getPlayersIdOptOuts,
  submitForm,
  deleteItem,
  getReportBrand,
  approveWin,
  rejectWin,
  openApproveWinDialog,
  submitApproval,
  softDelete,
  approve,
  reject,
  enable,
  disable,
} 

export default jackpotsApi
