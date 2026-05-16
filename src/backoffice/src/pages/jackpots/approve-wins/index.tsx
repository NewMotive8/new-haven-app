import React from 'react'
import { GetServerSidePropsContext } from 'next'
import { defaultServerSideProps } from 'utils/functions/serverSide'
import WinsCrud from 'layouts/jackpots/wins'

export default function Page() {
    return (<WinsCrud />)
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    return defaultServerSideProps(context)
}
