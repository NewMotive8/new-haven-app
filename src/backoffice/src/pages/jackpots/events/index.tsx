import React from 'react'
import { GetServerSidePropsContext } from 'next'
import { defaultServerSideProps } from 'utils/functions/serverSide'

import EventsCrud from 'layouts/jackpots/events'

export default function Page() {
  return <EventsCrud />
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  return defaultServerSideProps(context)
}
