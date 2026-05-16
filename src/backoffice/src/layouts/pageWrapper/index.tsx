import React from 'react'
import Navbar from 'components/navbar'
import Grid from 'components/uiKit/grid'
import SideMenu from 'components/navbar/sideMenu'
// import AuthContext from 'context/auth'
import AuthContext from 'context/auth'
import LoginPageLayout from 'layouts/userForms/login/loginPageLayout'
import { pagesWrapperProps } from './types'

export default function PagesWrapper({ children }: pagesWrapperProps) {
    const { isAuthenticated } = React.useContext(AuthContext)
    

    if (!isAuthenticated) {
        return <LoginPageLayout />
    }

    return (
        <>
            <Navbar />
            <Grid verticalAlgin="flex-start">
                <Grid verticalAlgin="flex-start" responsiveWidth={{ sm: 0, md: '300px' }}>
                    <SideMenu />
                </Grid>
                <Grid
                    padding={['p-3']}
                    responsiveWidth={{ sm: 100, md: 'calc(100% - 300px)' }}
                    style={{
                        height: 'calc(100dvh - var(--navbar-height))',
                        overflowY: 'scroll',
                    }}
                >
                    {children}
                </Grid>
            </Grid>
        </>
    )
}
