import React from 'react'
import { GetServerSidePropsContext } from 'next'
import dynamic from 'next/dynamic'
import { defaultServerSideProps } from 'utils/functions/serverSide'

const LWRuleProgressLayout = dynamic(() => import('layouts/luckyWheel/ruleProgress'), { ssr: false })

export default function Page() {
    return (<LWRuleProgressLayout />)
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    return defaultServerSideProps(context)
}
