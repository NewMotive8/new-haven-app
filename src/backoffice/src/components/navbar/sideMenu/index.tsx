import Grid from 'components/uiKit/grid'
import React from 'react'
import ToggleTheme from 'components/uiKit/toggleTheme'
import { BsTranslate } from 'react-icons/bs'
import Loading from 'assets/loading'
import { globalData } from 'pages/_app'
import { useRouter } from 'next/router'
import { useAccountInfo } from 'utils/customHooks/useRole'
import styles from './styles.module.scss'
import MenuGroup from './menuGroup'

export default function SideMenu() {
    const { isLoading, role } = useAccountInfo()

    const router = useRouter()

    const toggleEditTranslations = () => {
        const currentQuery = { ...router.query }

        if ('editTranslations' in currentQuery) {
            delete currentQuery.editTranslations
            globalData.editTranslations = false
        } else {
            currentQuery.editTranslations = 'true'
            globalData.editTranslations = true
        }
        router.replace({
            pathname: router.pathname,
            query: currentQuery,
        }, undefined, { shallow: true })
    }

    return (
        <Grid className={styles.wrapper} verticalAlgin="space-between">
            <Grid gap="1rem" padding={['p-3']} style={{ overflow: 'auto', maxHeight: 'calc(var(--vh) - 140px)' }}>
                {
                    isLoading
                        ? <Loading />
                        : <MenuGroup userRole={role} />
                }
            </Grid>
            <Grid gap="1rem" padding={['p-3']} className={styles['menu-footer']} horizontalAlgin="flex-end">
                {
                    isLoading
                        ? <Loading />
                        : role === 'ROOT'
                            ? <BsTranslate cursor="pointer" size={30} onClick={() => toggleEditTranslations()} />
                            : <></>
                }

                <ToggleTheme />
            </Grid>
        </Grid>
    )
}
