    import React from 'react'
    import { GetServerSidePropsContext } from 'next'
    import { defaultServerSideProps } from 'utils/functions/serverSide'
import UsersCrud from 'layouts/admin/users'

    export default function Page() {
        return (<UsersCrud />)
    }

    export async function getServerSideProps(context: GetServerSidePropsContext) {
        return defaultServerSideProps(context)
    }
