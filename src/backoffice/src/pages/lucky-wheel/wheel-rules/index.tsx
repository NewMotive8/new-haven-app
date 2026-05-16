import React from 'react'
import { GetServerSidePropsContext } from 'next'
import dynamic from 'next/dynamic'
import { defaultServerSideProps } from 'utils/functions/serverSide'

const LWRulesLayout = dynamic(() => import('layouts/luckyWheel/rules'), { ssr: false })

export default function Page() {
    return (<LWRulesLayout />)
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    return defaultServerSideProps(context)
}
