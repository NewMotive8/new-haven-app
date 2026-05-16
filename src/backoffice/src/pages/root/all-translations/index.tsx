import React from 'react'
import { GetServerSidePropsContext } from 'next'
import { defaultServerSideProps } from 'utils/functions/serverSide'
import BoTranslationsCrud from 'layouts/root/boTranslations'

export default function Page() {
    return (<BoTranslationsCrud />)
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    return defaultServerSideProps(context)
}
