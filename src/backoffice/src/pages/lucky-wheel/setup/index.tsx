import React from 'react'
import { GetServerSidePropsContext } from 'next'
import dynamic from 'next/dynamic'
import { defaultServerSideProps } from 'utils/functions/serverSide'

const SetupLuckyWheelLayout = dynamic(() => import('layouts/luckyWheel/setup'), { ssr: false })

export default function Page() {
    return (<SetupLuckyWheelLayout />)
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    return defaultServerSideProps(context)
}
