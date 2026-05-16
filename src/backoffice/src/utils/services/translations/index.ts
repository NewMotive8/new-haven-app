import { GetServerSidePropsContext } from 'next'
import { getCookie } from 'cookies-next'
import { api } from '../api'
import appTranslations from './appTranslations'

export const useQueryDefaultSetting = {
    staleTime: 120000, // 2 minutes to refresh the calls
}

export default async function getTranslationsFromBE(context: GetServerSidePropsContext) {
    const translations = await appTranslations()
    return translations
}
