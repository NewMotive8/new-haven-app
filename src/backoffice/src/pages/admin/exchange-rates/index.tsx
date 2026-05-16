import React from 'react'
import { GetServerSidePropsContext } from 'next'
import { defaultServerSideProps } from 'utils/functions/serverSide'
import ExchangeRatesCrud from 'layouts/admin/exchange-rates'

export default function Page() {
  return <ExchangeRatesCrud />
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  return defaultServerSideProps(context)
}
