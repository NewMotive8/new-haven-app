    import React from 'react'
    import { GetServerSidePropsContext } from 'next'
    import { defaultServerSideProps } from 'utils/functions/serverSide'
    import BrandCrud from 'layouts/admin/brand'

    export default function Page() {
        return (<BrandCrud />)
    }

    export async function getServerSideProps(context: GetServerSidePropsContext) {
        return defaultServerSideProps(context)
    }
