import React from 'react'
import { GetServerSidePropsContext } from 'next'
import dynamic from 'next/dynamic'
import { defaultServerSideProps } from 'utils/functions/serverSide'

const LWRuleInstancesLayout = dynamic(() => import('layouts/luckyWheel/ruleInstances'), { ssr: false })

export default function Page() {
    return (<LWRuleInstancesLayout />)
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    return defaultServerSideProps(context)
}
