import React, { useContext } from 'react'
import GlobalContext from 'context/global'
import NavBarSM from './versions/sm'
import NavbarMD from './versions/md'
import styles from './index.module.scss'

export default function Navbar() {
    const { state } = useContext(GlobalContext)
    const { appSize } = state
    return (
        <>
            <div className={styles['navbar-placeholder']} />
            <div className={styles.navbar}>
                {
                    appSize.includes('sm')
                        ? <NavBarSM />
                        : <NavbarMD />
                }
            </div>
        </>
    )
}
