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
import { TournamentI, defaultTournament } from './types'

export interface tournamentsI extends TournamentI {}

const defaultItem: tournamentsI = {
  ...defaultTournament,
}
async function getPlayersIdOptIns(tournamentId: number) {
  return api.get(
    urls.tournaments.getPlayersIdOptIns.replace('{{tournamentId}}', `${tournamentId}`),
  )
}

async function getPlayersIdOptOuts(tournamentId: number) {
  return api.get(
    urls.tournaments.getPlayersIdOptOut.replace('{{tournamentId}}', `${tournamentId}`),
  )
}

async function getItems(params?: pageableProps) {
  return api
    .get(urls.tournaments.getAll, { params })
    .then((res) => ({ content: res.data }))
}
async function getReport(tournamentId: number) {
  return api.get(
    urls.tournaments.getReportsSnap.replace('{{tournamentId}}', `${tournamentId}`),
  )
}
async function getReportBrand(brandId: number, tournamentId?: number) {
  const config = {
    headers: {
      brandId,
    },
  }
  return api
    .get(
      urls.tournaments.getReportsBrand.replace(
        '/{{tournamentId}}',
        String(`?tournamentId=${tournamentId}`),
      ),
      config,
    )
    .then((res) => ({ content: res.data }))
}

async function submitApproval(tournamentId: number) {
  return api.get(
    urls.tournaments.submitApproval.replace('{{tournamentId}}', `${tournamentId}`),
  )
}
async function approve(tournamentId: number) {
  return api.get(urls.tournaments.approve.replace('{{tournamentId}}', `${tournamentId}`))
}

async function reject(tournamentId: number) {
  return api.get(urls.tournaments.reject.replace('{{tournamentId}}', `${tournamentId}`))
}
async function enable(tournamentId: number) {
  return api.get(urls.tournaments.enable.replace('{{tournamentId}}', `${tournamentId}`))
}
async function disable(tournamentId: number) {
  return api.get(urls.tournaments.disable.replace('{{tournamentId}}', `${tournamentId}`))
}
async function softDelete(tournamentId: number) {
  return api.delete(`${urls.tournaments.delete}/${tournamentId}`)
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
    .delete(`${urls.jackpots.delete}/${id}`)
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
async function submitForm(formData: tournamentsI, options?: submitFormOptions) {
  const { errorCallBack, successCallBack, silent } = options || {}
  const action = formData?.id ? api.put : api.post
  const url = formData?.id
    ? `${urls.tournaments.update}/${formData.id}`
    : urls.tournaments.create
  await action(url, { ...formData, id: formData.id ? formData.id : null })
    .then((res) => {
      if (successCallBack) {
        successCallBack(res?.data)
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

const tournamentsApi = {
  defaultItem,
  deleteItem,
  submitForm,
  getItems,
  getReport,
  submitApproval,
  approve,
  reject,
  enable,
  disable,
  softDelete,
  getReportBrand,
  getPlayersIdOptIns,
  getPlayersIdOptOuts,
}

export default tournamentsApi