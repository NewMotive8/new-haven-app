import { buttonColors } from 'components/uiKit/buttons/types'
import React, { useState } from 'react'
import { gridBaseProps } from 'components/uiKit/grid/types'
import Grid from 'components/uiKit/grid'
import { RiArrowDownSLine } from 'react-icons/ri'
import Card from '../card'
import styles from './style.module.scss'

interface Props extends Omit<gridBaseProps, 'label' | 'value' | 'children'> {
    color?: buttonColors | 'root' | 'section' | 'transparent',
    children: React.ReactNode,
    header: React.ReactElement | string,
    maxHeight?: number,
    defaultState?: 'expand' | 'collapse'
}

export default function ExpandCollapseCard(props: Props) {
    const {
        children,
        header,
        maxHeight,
        defaultState,
        ...cardProps
    } = props
    const [state, setState] = useState<'expand' | 'collapse'>(defaultState || 'collapse')

    return (
        <Card
            {...cardProps}
            className={styles.wrapper}
            gap="0"
        >
            <Grid
                wrap="nowrap"
                verticalAlgin="stretch"
                onClick={() => setState((current) => (current === 'expand' ? 'collapse' : 'expand'))}
                style={{ cursor: 'pointer' }}
            >
                <Grid verticalAlgin="center">
                    {header}
                </Grid>
                <Grid width="fit-content" verticalAlgin="center" className={styles.icon} data-state={state}>
                    <RiArrowDownSLine size={25} />
                </Grid>
            </Grid>
            <Grid
                className={styles['content-box']}
                style={{
                    maxHeight: state === 'collapse' ? '0px' : `${maxHeight || 1000}px`,
                    overflow: 'hidden',
                }}
                padding={state === 'expand' ? ['pt-1'] : []}
            >
                {children}
            </Grid>
        </Card>
    )
}
