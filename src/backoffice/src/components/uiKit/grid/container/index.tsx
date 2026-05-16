import React from 'react'
import styles from './container.module.scss'

interface Props extends React.HTMLProps<HTMLDivElement> {
    children: React.ReactNode,
    wrapperProps?: React.HTMLProps<HTMLDivElement>
}

export default function Container({ children, wrapperProps, ...containerProps }: Props) {
    return (
        <div className={styles['container-wrapper']} {...wrapperProps}>
            <div className={styles.container} {...containerProps}>
                {children}
            </div>
        </div>
    )
}
