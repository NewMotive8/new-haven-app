import React from 'react'
import { GetServerSidePropsContext } from 'next'
import { defaultServerSideProps } from 'utils/functions/serverSide'
import DashboardCrud from 'layouts/jackpots/dashboard'

export default function Page() {
  return <DashboardCrud />
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  return defaultServerSideProps(context)
}
