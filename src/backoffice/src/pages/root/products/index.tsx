import React from 'react'
import { GetServerSidePropsContext } from 'next'
import { defaultServerSideProps } from 'utils/functions/serverSide'
import ProductsCrud from 'layouts/root/products'

export default function Page() {
    return (<ProductsCrud />)
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    return defaultServerSideProps(context)
}
