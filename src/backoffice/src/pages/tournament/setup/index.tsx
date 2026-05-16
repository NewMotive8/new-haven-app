import React from 'react'
import { GetServerSidePropsContext } from 'next'
import dynamic from 'next/dynamic'
import { defaultServerSideProps } from 'utils/functions/serverSide'

const SetupTournamentLayout = dynamic(() => import('layouts/tournaments/tournament'), { ssr: false })

export default function Page() {
    return (<SetupTournamentLayout />)
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    return defaultServerSideProps(context)
}
