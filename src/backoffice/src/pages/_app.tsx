import '../styles/root.scss'
import '../styles/globals.scss'
import '../styles/jooba-lucky-wheel.css'
import type { AppProps } from 'next/app'
import PagesWrapper from 'layouts/pageWrapper'
import { GlobalProvider } from 'context/global'
import { AuthProvider } from 'context/auth'
import { DialogProvider } from 'context/dialog'
import { QueryClient, QueryClientProvider } from 'react-query'
import { useEffect } from 'react'
import { ToastContainer } from 'react-toastify'
import { getRealScreenHeight } from 'utils/functions/styles'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { BrandProvider } from 'context/brand'
import Script from 'next/script'

export const queryClient = new QueryClient()
export const globalData = {
  translations: [],
  editTranslations: false,
  locale: 'en-GB',
  brandId: 0 as number | undefined,
}

export default function App(props: AppProps) {
  const {
    Component,
    pageProps,
    router,
  } = props
  const { locale, translations, theme } = pageProps
  const { query } = useRouter()
  const { editTranslations } = query
  globalData.translations = translations
  globalData.editTranslations = !!editTranslations
  globalData.locale = locale
  useEffect(() => {
    getRealScreenHeight()
  }, [])

  return (
    <>
      <Head>
        <title>Engagd back office</title>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      </Head>
      <Script
        id="jooba"
        src={`${process.env.NEXT_PUBLIC_CDN_URL || 'http://localhost:3015/cdn'}/dist/jooba.min.js?v=${Math.random()}`}
      />
      <Script
        id="jooba"
        src="/libs/jooba/jooba.lw.min.js"
      />
      <Script
        id="engagd-wheel"
        src="/libs/engagd/wheel-module.js"
      />
      <Script
        id="engagd-wheel"
        src="/libs/engagd/spin-animation.js"
      />
      <Script
        id="gsap"
        src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"
      />

      <QueryClientProvider client={queryClient}>
        <GlobalProvider locale={locale}>
          <AuthProvider pageProps={pageProps}>
            <BrandProvider>
              <DialogProvider>
                <ToastContainer theme="colored" />
                {
                  router.route === '/404' || router.route === '/_error'
                    ? <Component {...pageProps} />
                    : router.route?.includes('/login')
                      || router.route?.includes('/register')
                      || router.route?.includes('/account/forgot-password')
                      || router.route?.includes('/account/reset-password')
                      || router.route?.includes('/reset-password')
                      ? <Component {...pageProps} />
                      : (
                        <PagesWrapper>
                          <Component {...pageProps} />
                        </PagesWrapper>
                      )
                }
              </DialogProvider>
            </BrandProvider>
          </AuthProvider>
        </GlobalProvider>
      </QueryClientProvider>

    </>
  )
}
