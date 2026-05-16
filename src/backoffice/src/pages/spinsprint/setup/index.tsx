import React from 'react'
import { GetServerSidePropsContext } from 'next'
import dynamic from 'next/dynamic'
import { defaultServerSideProps } from 'utils/functions/serverSide'

const SetupLuckyJRlLayout = dynamic(() => import('layouts/jackpotRaces/jackpotRace'), { ssr: false })

export default function Page() {
    return (<SetupLuckyJRlLayout />)
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    return defaultServerSideProps(context)
}
