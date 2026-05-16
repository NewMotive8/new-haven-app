import React from 'react'
import { GetServerSidePropsContext } from 'next'
import dynamic from 'next/dynamic'
import { defaultServerSideProps } from 'utils/functions/serverSide'

const CrudLayout = dynamic(() => import('layouts/jackpotRaces/player'), { ssr: false })

export default function Page() {
    return (<CrudLayout />)
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    return defaultServerSideProps(context)
}
