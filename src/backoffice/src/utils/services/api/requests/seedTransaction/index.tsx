import { pageableProps } from 'utils/services/api/types'
import { api } from '../..'
import urls from '../../urls'

async function getItems(id: number, params?: pageableProps) {
  return api
    .get(
      urls.seedTransaction.getAll.replace('{{seedTransactionId}}', `${id}`),
      { params },
    )
    .then((res) => res.data)
}

const seedTransactionApi = {
  getItems,
}

export default seedTransactionApi
