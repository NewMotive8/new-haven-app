import Grid from 'components/uiKit/grid'
import React from 'react'
import LoginForm from '.'

export default function LoginPageLayout() {
    return (
        <Grid
            style={{
                height: 'var(--vh,100vh)',
            }}
            horizontalAlgin="center"
            verticalAlgin="center"
        >
            <LoginForm />
        </Grid>
    )
}
