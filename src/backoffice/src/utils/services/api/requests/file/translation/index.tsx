import { textTranslated } from 'components/TextTranslated'
import { toastError, toastSuccess } from 'utils/functions/notifications'
import { api } from 'utils/services/api'
import urls from 'utils/services/api/urls'

interface submitFormOptions {
  successCallBack?: Function;
  errorCallBack?: Function;
  silent?: boolean;
  config?: any;
}
async function submitForm(formData: any, options?: submitFormOptions) {
  const {
 errorCallBack, successCallBack, silent, config,
} = options || {}
  const action = api.post
  const url = `${urls.translationsBO.file}`
  await action(url, formData, config)
    .then(() => {
      if (successCallBack) {
        successCallBack()
      }
      if (!silent) {
        toastSuccess(
          textTranslated({
            group: 'toast-notifications',
            key: 'generic-upload-file-success',
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
            key: 'generic-upload-file-error',
          }),
        )
      }
    })
}
const fileTranslateApi = {
  submitForm,
}

export default fileTranslateApi
