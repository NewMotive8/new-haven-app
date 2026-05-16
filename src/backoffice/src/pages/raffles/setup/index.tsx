import React from 'react'
import { GetServerSidePropsContext } from 'next'
import dynamic from 'next/dynamic'
import { defaultServerSideProps } from 'utils/functions/serverSide'

const SetupLuckyRFlLayout = dynamic(() => import('layouts/raffles/raffle'), { ssr: false })

export default function Page() {
    return (<SetupLuckyRFlLayout />)
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    return defaultServerSideProps(context)
}
