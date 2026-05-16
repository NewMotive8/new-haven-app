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
import { parseParamsToAddFilterById } from 'utils/functions/requests/requestParams'
import { api } from '../..'
import urls from '../../urls'

export enum SeedType {
  Fixed = 1,
  Percentage = 2,
  SharedFixed = 3,
  SharedPercentage = 4,
}
export interface seedsI {
  id?: number | null | undefined;
  name: string;
  type: SeedType;
  maximumAmount: number;
  currentAmount: number;
  contributionAmount: number;
  playerContributionPercent: number;
  operatorContribution: number;
  operator: null | string;
  minimumAmount: number;
  targetAmount: number | null;
  minContributionAmount?: number;
  maxContributionAmount?: number;
  multiLevelWeight?: number;
  multiLevelTier?: number;
}

const defaultItem: seedsI = {
  id: undefined,
  name: '',
  type: 1,
  maximumAmount: 0,
  currentAmount: 0,
  contributionAmount: 0,
  playerContributionPercent: 100,
  operatorContribution: 0,
  operator: null,
  minimumAmount: 0,
  targetAmount: null,
  minContributionAmount: 0,
  maxContributionAmount: 0,
  multiLevelWeight: 0,
  multiLevelTier: 0

}

async function getItems(params?: pageableProps) {
  return api
    .get(urls.seeds.getAll, { params })
    .then((res) => ({ content: res.data }))
}

async function getItemsById(id: number, params?: pageableProps) {
  return api
    .get(urls.seeds.getById, { params: parseParamsToAddFilterById(id, params) })
    .then((res) => res.data[0] || {})
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
    .delete(`${urls.seeds.delete}/${id}`)
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
async function submitForm(formData: seedsI, options?: submitFormOptions) {
  const { errorCallBack, successCallBack, silent } = options || {}
  const action = formData?.id ? api.put : api.post
  const url = formData?.id
    ? `${urls.seeds.update}/${formData.id}`
    : urls.seeds.create
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

const seedsApi = {
  defaultItem,
  deleteItem,
  submitForm,
  getItems,
  getItemsById,
}

export default seedsApi
