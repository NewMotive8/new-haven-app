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
import { ResetPasswordI } from 'layouts/userForms/resetPassword/types'
import { api } from '../..'
import urls from '../../urls'

export interface usersI {
  id: number | null | undefined
  email: string
  name: string
  password: string
  resetKey?: string
  role: string
  enabled?: boolean
  brands: Array<any>
}

const defaultItem: usersI = {
  id: undefined,
  email: '',
  name: '',
  password: '',
  role: '',
  enabled: false,
  brands: [],
}

async function getItems(params?: pageableProps) {
  return api
    .get(urls.users.getAll, { params })
    .then((res) => ({ content: res.data }))
}

interface deleteItemI {
  id: number | string
  successCallBack?: Function
  errorCallBack?: Function
}

async function handleConfirmDelete({
  id,
  successCallBack,
  errorCallBack,
}: deleteItemI) {
  await api
    .delete(`${urls.users.delete}/${id}`)
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
  successCallBack?: Function
  errorCallBack?: Function
  silent?: boolean
}
async function submitForm(formData: usersI, options?: submitFormOptions) {
  const { errorCallBack, successCallBack, silent } = options || {}
  const action = formData?.id ? api.put : api.post
  const url = formData?.id
    ? `${urls.users.update}/${formData.id}`
    : urls.users.create
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
          textTranslated({
            group: 'toast-notifications',
            key: toastMessageKey,
          }),
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
interface ResetProps {
  email: string
  successCallBack?: Function
  errorCallBack?: Function
  disableConfirmation?: boolean
}
async function resetPassword({
  email,
  successCallBack,
  errorCallBack,
  disableConfirmation = false,
}: ResetProps) {
  if (!disableConfirmation) {
    externalDialogCall.dialogConfirm({
      title: (
        <Typography
          translateGroup="global"
          translateKey="are-you-sure?"
          weight={600}
        />
      ),
      cancelLabel: (
        <Typography
          translateGroup="global"
          translateKey="cancel"
          weight={600}
        />
      ),
      confirmLabel: (
        <Typography
          translateGroup="global"
          translateKey="confirm"
          weight={600}
        />
      ),
      children: (
        <Typography
          translateGroup="global"
          translateKey="reset-password-instruction"
          weight={600}
          style={{ textAlign: 'center' }}
        />
      ),
      onCancelCallBack: () => {},
      onConfirmCallBack: async () => {
        await api
          .post(`${urls.user.resetPassword}`, { email })
          .then(() => {
            if (successCallBack) {
              successCallBack()
            }
            toastInfo(
              textTranslated({
                group: 'toast-notifications',
                key: 'reset-password-instructions',
              }),
              { autoClose: false },
            )
          })
          .catch((err) => {
            if (errorCallBack) {
              errorCallBack()
            }
            toastError(
              textTranslated({
                group: 'toast-notifications',
                key: 'generic-error-message',
              }),
            )
          })
      },
    })
  } else {
    await api
      .post(`${urls.user.resetPassword}`, { email })
      .then(() => {
        if (successCallBack) {
          successCallBack()
        }
        toastInfo(
          textTranslated({
            group: 'toast-notifications',
            key: 'reset-password-instructions',
          }),
          { autoClose: false },
        )
      })
      .catch((err) => {
        if (errorCallBack) {
          errorCallBack()
        }
        toastError(
          textTranslated({
            group: 'toast-notifications',
            key: 'generic-error-message',
          }),
        )
      })
  }
}
async function resetPasswordFinish(formData: ResetPasswordI) {
  await api
    .post(urls.user.resetPasswordFinish, {
      key: formData.key,
      newPassword: formData.newPassword,
    } as Partial<ResetPasswordI>)
    .then((response) => {
      toastSuccess(
        <Typography translateGroup="reset-form" translateKey="reset-success" />,
      )
      return response
    })
    .catch((err) => {
      toastError(
        textTranslated({
          group: 'toast-notifications',
          key: 'generic-error-message',
        }),
      )
      throw err
    })
}
const usersApi = {
  defaultItem,
  deleteItem,
  submitForm,
  getItems,
  resetPassword,
  resetPasswordFinish,
}

export default usersApi
