import { api } from '../../..'
import urls from '../../../urls'
import { textTranslated } from 'components/TextTranslated'
import { toastError, toastInfo, toastSuccess } from 'utils/functions/notifications'
import { externalDialogCall } from 'context/dialog'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import Button from 'components/uiKit/buttons'

export interface widgetI {
  id?: number
  raffle?: { id: number }
  locale?: string
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

export const defaultItem: widgetI = {
  locale: 'en',
  tcsIsLink: false,
}

/* =======================
   GET BY SPINSPRINT
======================= */
export async function getByRaffle(raffleId: number) {
  return api
    .get(urls.RF.widget.getByRaffle.replace('{{raffleId}}', String(raffleId)))
    .then(res => res.data)
}

/* =======================
   DELETE
======================= */
interface deleteItemI {
  id: number | string
  successCallBack?: Function
  errorCallBack?: Function
}

async function handleConfirmDelete({ id, successCallBack, errorCallBack }: deleteItemI) {
  await api
    .delete(`${urls.RF.widget.delete}/${id}`)
    .then(res => {
      successCallBack?.(res)
      toastInfo(textTranslated({ group: 'toast-notifications', key: 'generic-delete-success' }))
      externalDialogCall.removeDialog('CONFIRM-DIALOG')
    })
    .catch(err => {
      errorCallBack?.(err)
      toastError(textTranslated({ group: 'toast-notifications', key: 'generic-error-message' }))
      externalDialogCall.removeDialog('CONFIRM-DIALOG')
    })
}

export async function deleteItem(props: deleteItemI) {
  externalDialogCall.displayDialog({
    dialogId: 'CONFIRM-DIALOG',
    content: (
      <Grid style={{ width: '250px', maxWidth: '90vw', background: 'var(--root-bg)', borderRadius: '4pt' }}
            padding={['pt-5','pb-5','ps-3','pe-3']}>
        <Grid margin="mb-5" horizontalAlgin="center">
          <Typography weight={700} size="xl" translateGroup="global" translateKey="are-you-sure?" />
        </Grid>
        <Grid horizontalAlgin="center" margin="mb-5">
          <Typography translateGroup="global" translateKey="this-will-be-permanent" weight={600} style={{ textAlign: 'center' }} />
        </Grid>
        <Grid horizontalAlgin="space-between">
          <Grid width={45}>
            <Button block color="secondary" onClick={() => externalDialogCall.removeDialog('CONFIRM-DIALOG')} id={''}>
              <Typography translateGroup="global" translateKey="cancel" weight={600}/>
            </Button>
          </Grid>
          <Grid width={45}>
            <Button block color="primary" onClick={() => handleConfirmDelete(props)} id={''}>
              <Typography translateGroup="global" translateKey="continue" weight={600}/>
            </Button>
          </Grid>
        </Grid>
      </Grid>
    )
  })
}

/* =======================
   SUBMIT FORM (CREATE / UPDATE)
======================= */
interface submitFormOptions {
  successCallBack?: (updatedWidget?: widgetI) => void
  errorCallBack?: () => void
  silent?: boolean
}

export async function submitForm(formData: widgetI, options?: submitFormOptions) {
  const { successCallBack, errorCallBack, silent } = options || {}

  if (!formData.raffle?.id) {
    toastError('Raffle ID is missing')
    errorCallBack?.()
    return
  }

  const action = formData.id ? api.put : api.post
  const url = formData.id ? `${urls.RF.widget.update}/${formData.id}` : urls.RF.widget.create

  await action(url, formData)
    .then(res => {
      const updatedWidget = res.data
      successCallBack?.(updatedWidget)

      if (!silent) {
        toastSuccess(
          textTranslated({
            group: 'toast-notifications',
            key: formData.id ? 'generic-update-success' : 'generic-create-success',
          }),
        )
      }
    })
    .catch(() => {
      errorCallBack?.()
      if (!silent) toastError(textTranslated({ group: 'toast-notifications', key: 'generic-error-message' }))
    })
}

const widgetApi = {
  defaultItem,
  getByRaffle,
  deleteItem,
  submitForm,
}

export default widgetApi
