import React from 'react'
import { GetServerSidePropsContext } from 'next'
import { defaultServerSideProps } from 'utils/functions/serverSide'
import WinsV2Crud from 'layouts/jackpots/winsV2'

export default function Page() {
    return (<WinsV2Crud />)
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    return defaultServerSideProps(context)
}
