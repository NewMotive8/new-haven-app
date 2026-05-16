import React from 'react'
import styles from './styles.module.scss'

interface Props {
    label: string | React.ReactNode | any
    onClick?: Function,
}

export default function SectionTitle(props: Props) {
    const { label, onClick } = props

    return (
        <div
            onClick={() => onClick && onClick()}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
            className={styles.wrapper}
        >
            {label}
        </div>
    )
}
