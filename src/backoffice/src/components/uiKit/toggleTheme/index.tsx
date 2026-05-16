import Grid from 'components/uiKit/grid'
import { getCookie, setCookie } from 'cookies-next'
import React from 'react'
import { IoSunny, IoMoon } from 'react-icons/io5'
import styles from './styles.module.scss'

export default function ToggleTheme() {
    const [theme, setTheme] = React.useState<any>(getCookie('app-theme' || ''))

    React.useEffect(() => {
        setTheme(getCookie('app-theme'))
    }, [])

    function toggleTheme() {
        const newTheme = theme === 'light' ? 'dark' : 'light'
        document.getElementById('_html')?.setAttribute('data-theme', newTheme)
        document.getElementById('_body')?.setAttribute('data-theme', newTheme)
        const date = new Date()
        date.setFullYear(date.getFullYear() + 10)
        setCookie('app-theme', newTheme, { expires: date })
        setTheme(newTheme)
    }

    return (
        <Grid width="fit-content" verticalAlgin="center" gap="0.25rem">
            <Grid id="theme-toggle" padding={['p-1']} onClick={() => toggleTheme()} className={styles.wrapper} width="fit-content" gap="0.5rem">
                <IoSunny className={styles['icon-light']} size={20} />
                <IoMoon className={styles['icon-dark']} size={20} />
                <div data-theme={theme} className={styles.toggle} />
            </Grid>
        </Grid>
    )
}
