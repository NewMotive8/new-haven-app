import React from 'react'
import { GetServerSidePropsContext } from 'next'
import { defaultServerSideProps } from 'utils/functions/serverSide'
import SeedsCrud from 'layouts/jackpots/admin/seeds'

export default function Page() {
    return (<SeedsCrud />)
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    return defaultServerSideProps(context)
}
