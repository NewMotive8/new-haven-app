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
import { api } from 'utils/services/api'
import urls from 'utils/services/api/urls'

export interface playerOptinsI {
  id?: number;
  raffleId: number;
  optin:boolean;
  player:Object;
  // Replace with the properties of your entity. This is just a placeholder.
}

const defaultItem: playerOptinsI = {
  id: undefined,
  raffleId: 0,
  optin: false,
  player: {},
  // Default values for your entity properties.
}
interface GetByPlayerPros extends pageableProps{
    playerId: number
    brandId?: any
}
async function getByPlayer({ playerId, ...params }: GetByPlayerPros) {
  return api
    .get(`${urls.RF.playerOptins.getAll}/player/${playerId}`, { params })
    .then((res) => ({ content: res.data }))
}

async function getItems(params?: pageableProps) {
  return api
    .get(urls.RF.raffle.getAll, { params })
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
  // await api.delete(`${urls.RF.playerOptins.delete}/${id}`).then((res) => {
  //     if (successCallBack) {
  //         successCallBack(res)
  //     }
  //     toastInfo(textTranslated({ group: 'toast-notifications', key: 'generic-delete-success' }))
  //     externalDialogCall.removeDialog('CONFIRM-DIALOG')
  // }).catch((err: any) => {
  //     if (errorCallBack) {
  //         errorCallBack(err)
  //     }
  //     toastError(textTranslated({ group: 'toast-notifications', key: 'generic-error-message' }))
  //     externalDialogCall.removeDialog('CONFIRM-DIALOG')
  // })
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
async function submitForm(
  formData: playerOptinsI,
  options?: submitFormOptions,
) {
  const { errorCallBack, successCallBack, silent } = options || {}
  const action = formData?.id ? api.put : api.post
  const url = formData?.id ? `${urls.RF.playerOptins.update}/${formData.id}` : urls.RF.playerOptins.create
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

const playerOptinsApi = {
  defaultItem,
  deleteItem,
  submitForm,
  getItems,
  getByPlayer,
}

export default playerOptinsApi
