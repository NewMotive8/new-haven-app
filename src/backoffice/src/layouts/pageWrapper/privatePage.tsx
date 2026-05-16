import Card from 'components/cards/card'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import Container from 'components/uiKit/grid/container'
import Typography from 'components/uiKit/typography'
import AuthContext from 'context/auth'
import DialogContext from 'context/dialog'
import Router from 'next/router'
import React from 'react'
import { AiOutlineStop } from 'react-icons/ai'
import { BsPerson } from 'react-icons/bs'

interface Props {
    children: React.ReactNode,
}

export default function PrivatePage(props: Props) {
    const { children } = props
    const { isAuthenticated } = React.useContext(AuthContext)

    const { displayDialog, removeDialog } = React.useContext(DialogContext)

    function handleDisplayLogin() {
        displayDialog({
            dialogId: 'LOGIN-FORM',
            content: <>LoginPopUp</>,
        })
    }
    function handleDisplayRegister() {
        displayDialog({
            dialogId: 'REGISTER-FORM',
            content: <>LoginPopUp</>,
        })
    }

    if (!isAuthenticated) {
        return (
            <Container>
                <Grid
                    verticalAlgin="center"
                    horizontalAlgin="center"
                    padding={['pt-5']}
                >
                    <Grid
                        responsiveWidth={{
                            sm: 100,
                            md: '400px',
                            lg: '600px',
                        }}
                        style={{
                            maxWidth: '90vw',
                            boxShadow: '0px 0px 10px -5px #000',
                            borderRadius: '8pt',
                        }}
                    >
                        <Card>
                            <Grid horizontalAlgin="center" gap="0.5rem" verticalAlgin="center">
                                <AiOutlineStop size={30} />
                                <Typography
                                    translateGroup="private-page-warn"
                                    translateKey="title"
                                    weight={600}
                                    size="xl"
                                />
                            </Grid>
                            <Grid padding={['p-3']} horizontalAlgin="center" gap="0.5rem" verticalAlgin="center">
                                <Typography
                                    translateGroup="private-page-warn"
                                    translateKey="subtitle"
                                />
                            </Grid>
                            <Grid
                                padding={['p-5']}
                                gap="1rem"
                                horizontalAlgin="center"
                                verticalAlgin="stretch"
                            >
                                <Button
                                    style={{
                                        width: 'calc(50% - 0.5rem)',
                                    }}
                                    id="private-page-warn-login-cta"
                                    type="button"
                                    onClick={() => handleDisplayLogin()}
                                >
                                    <Typography
                                        translateGroup="global"
                                        translateKey="login"
                                        size="sm"
                                        weight={600}
                                    />
                                </Button>
                                <Button
                                    style={{
                                        width: 'calc(50% - 0.5rem)',
                                    }}
                                    id="private-page-warn-register-cta"
                                    color="secondary"
                                    type="button"
                                    onClick={() => handleDisplayRegister()}
                                >
                                    <Grid
                                        horizontalAlgin="center"
                                        verticalAlgin="center"
                                        gap="5px"
                                    >
                                        <BsPerson />
                                        <Typography
                                            translateGroup="global"
                                            translateKey="register"
                                            size="sm"
                                            weight={600}
                                        />
                                    </Grid>
                                </Button>
                            </Grid>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        )
    }

    return <>{children}</>
}
