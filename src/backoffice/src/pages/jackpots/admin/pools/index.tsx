    import React from 'react'
    import { GetServerSidePropsContext } from 'next'
    import { defaultServerSideProps } from 'utils/functions/serverSide'
import PoolsCrud from 'layouts/jackpots/admin/pools'

    export default function Page() {
        return (<PoolsCrud />)
    }

    export async function getServerSideProps(context: GetServerSidePropsContext) {
        return defaultServerSideProps(context)
    }
