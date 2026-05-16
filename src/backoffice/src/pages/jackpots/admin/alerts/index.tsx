import React from 'react'
import { GetServerSidePropsContext } from 'next'
import { defaultServerSideProps } from 'utils/functions/serverSide'
import AlertsCrud from 'layouts/jackpots/admin/alerts'

export default function Page() {
  return <AlertsCrud />
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  return defaultServerSideProps(context)
}
