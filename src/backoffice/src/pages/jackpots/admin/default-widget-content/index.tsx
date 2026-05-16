import React from 'react'
import { GetServerSidePropsContext } from 'next'
import { defaultServerSideProps } from 'utils/functions/serverSide'
import DefaultTranslationsCrud from 'layouts/jackpots/admin/defaultTranslations'

export default function Page() {
    return (<DefaultTranslationsCrud />)
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    return defaultServerSideProps(context)
}
