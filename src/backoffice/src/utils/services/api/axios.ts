import axios from 'axios'
import { externalGetAuthStatus } from 'context/auth'
import { externalDialogCall } from 'context/dialog'

export function getAPIClient() {
  const api = axios.create({
    headers: {
      'Content-type': 'application/json',
      'X-Forwarded-For': process.env.NEXT_PUBLIC_API_ENDPOINT?.replace('/api', '') || 'http://localhost:19100',
      brandId: null,
    },
  })
    api.interceptors.response.use(async (response: any) => {
      return response
    }, (error) => {
      if (error?.response?.status === 401) {
        externalGetAuthStatus.logout()
        externalDialogCall.removeAllDialogs()
      }
      return Promise.reject(error)
    })
  return api
}
