import Grid from 'components/uiKit/grid'
import React from 'react'
import ToggleTheme from 'components/uiKit/toggleTheme'
import styles from './styles.module.scss'

export default function NavbarSmMenu() {
    // const { displayDialog, removeDialog } = useContext(DialogContext)
    // removeDialog('SM-MENU')

    return (
        <Grid className={styles.wrapper} verticalAlgin="space-between">
            <Grid padding={['p-3']} horizontalAlgin="center">
                { ' ' }
            </Grid>
            <Grid padding={['p-3']} className={styles['menu-footer']} horizontalAlgin="flex-end">
                <ToggleTheme />
            </Grid>
        </Grid>
    )
}
