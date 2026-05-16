import { api } from '../..'
import urls from '../../urls'
import { toastError, toastSuccess } from 'utils/functions/notifications'
import { textTranslated } from 'components/TextTranslated'

async function generatePoolTransactionsReport(poolId: number) {
  try {
    await api.post(`${urls.pools.exports.poolTransactions}?poolId=${poolId}`)
    toastSuccess(
      textTranslated({
        group: 'toast-notifications',
          key: 'report-email-initiated',
        defaultContent: 'CSV report generation started. You will receive it by email shortly.',
 
      }),
    )
  } catch (err) {
    toastError(
      textTranslated({
        group: 'toast-notifications',
        key: 'generic-error-message',
      }),
    )
  }
}

async function generateSeedTransactionsReport(seedId: number) {
  try {
    await api.post(`${urls.seeds.exports.seedTransactions}?seedId=${seedId}`)
    toastSuccess(
      textTranslated({
        group: 'toast-notifications',
        key: 'report-email-initiated',
        defaultContent: 'CSV report generation started. You will receive it by email shortly.',
      }),
    )
  } catch (err) {
    toastError(
      textTranslated({
        group: 'toast-notifications',
        key: 'generic-error-message',
      }),
    )
  }
}

const exportsApi = {
  generatePoolTransactionsReport,
  generateSeedTransactionsReport,
}

export default exportsApi
