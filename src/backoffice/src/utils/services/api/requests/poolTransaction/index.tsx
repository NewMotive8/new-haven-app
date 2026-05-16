import { pageableProps } from 'utils/services/api/types'
import { api } from '../..'
import urls from '../../urls'

async function getItems(id: number, params?: pageableProps) {
  return api
    .get(
      urls.poolTransaction.getAll.replace('{{poolTransactionId}}', `${id}`),
      { params },
    )
    .then((res) => res.data)
}

const poolTransactionApi = {
  getItems,
}

export default poolTransactionApi
