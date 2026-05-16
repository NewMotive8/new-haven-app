import { buttonColors } from 'components/uiKit/buttons/types'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import React from 'react'
import { gridBaseProps } from 'components/uiKit/grid/types'
import styles from './styles.module.scss'

interface Props extends Omit<gridBaseProps, 'label' | 'value' | 'children'> {
    color?: buttonColors | 'root' | 'section' | 'transparent',
    children: React.ReactNode
}

export default function Card(props: Props) {
    const {
        color,
        className,
        children,
        ...cardProps
    } = props

    return (
        <Grid
            gap="1rem"
            data-color={color || 'primary'}
            className={`${styles.card} ${className || ''}`}
            padding={['p-3']}
            {...cardProps}
        >
            {children}
        </Grid>
    )
}
