import React from 'react'
import { GetServerSidePropsContext } from 'next'
import { defaultServerSideProps } from 'utils/functions/serverSide'
import TranslationsJackpotCrud from 'layouts/jackpots/admin/translationsJackpot'

export default function Page() {
    return (<TranslationsJackpotCrud />)
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    return defaultServerSideProps(context)
}
