import React, { useContext, useEffect, useState } from 'react'
import Grid from 'components/uiKit/grid'
import { GiHamburgerMenu } from 'react-icons/gi'
import DialogContext from 'context/dialog'
import dynamic from 'next/dynamic'
import styles from './styles.module.scss'
import NavbarSmMenu from './menu'

const AppLogo = dynamic(() => import('assets/logo'), { ssr: false })

export default function NavbarMD() {
    const [menuOpen, setMenuOpen] = useState(false)
    const { displayDialog, removeDialog } = useContext(DialogContext)

    useEffect(() => {
        if (menuOpen) {
            displayDialog({
                dialogId: 'SM-MENU',
                dialogProps: {
                    displayClose: false,
                    height: 'UNDER-NAVBAR',
                    anchor: 'top',
                },
                content: (<NavbarSmMenu />),
            })
        } else {
            removeDialog('SM-MENU')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [menuOpen])

    return (
        <Grid
            verticalAlgin="center"
            className={styles.wrapper}
            horizontalAlgin="space-between"
            wrap="nowrap"
            padding={['p-3']}
        >
            <Grid>
                <AppLogo height={40} width={100} />
            </Grid>
            <Grid horizontalAlgin="flex-end">
                <GiHamburgerMenu
                    onClick={() => setMenuOpen(!menuOpen)}
                    size={30}
                    style={{
                        transform: `rotate(${menuOpen ? '90deg' : '0deg'})`,
                        transition: 'transform 0.25s ease-in-out',
                    }}
                />
            </Grid>
        </Grid>
    )
}
