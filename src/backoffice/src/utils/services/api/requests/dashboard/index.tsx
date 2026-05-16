import { pageableProps } from 'utils/services/api/types'
import { api } from '../..'
import urls from '../../urls'

export interface dashboardI {
  id?: number | null | undefined;
}

const defaultItem: dashboardI = {
  id: undefined,
}

async function getItems(params?: pageableProps) {
  return api
    .get(urls.jackpots.getAll, { params })
    .then((res) => (res.data))
}

const dashboardApi = {
  defaultItem,
  getItems,
}

export default dashboardApi
