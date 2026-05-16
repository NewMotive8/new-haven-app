import { getCookie } from 'cookies-next'
import { GetServerSidePropsContext } from 'next'
import getTranslationsFromBE from 'utils/services/translations'

export async function defaultServerSideProps(context: GetServerSidePropsContext) {
    const theme = getCookie('app-theme', context) || 'light'
    const jwtToken = getCookie(process.env.NEXT_PUBLIC_API_JWT_NAME || '', context) || ''
    const { locale } = context
    const translations = await getTranslationsFromBE(context)
    context.res.setHeader(
        'Cache-Control',
        'public, s-maxage=31536000, stale-while-revalidate=6000',
    )
    return {
        props: {
            jwtToken,
            locale,
            translations,
            theme,
        },
    }
}
