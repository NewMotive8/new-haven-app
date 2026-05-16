import { getAPIClient } from './axios'

export const api = getAPIClient()

export const useQueryDefaultSetting = {
    staleTime: 120000, // 2 minutes to refresh the calls
}
