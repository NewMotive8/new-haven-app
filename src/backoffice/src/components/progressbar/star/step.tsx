import StarFilled from 'assets/icons/starFilled'
import StarNonFilled from 'assets/icons/starNonFilled'
import React from 'react'
import styles from './step.module.scss'

interface Props {
    filled: boolean,
    label: React.ReactNode,
    position: number,
}

export default function StepStarProgress(props: Props) {
    const { filled, label, position } = props

    return (
        <div
            style={{
                left: `calc(${position}% - 40px)`,
            }}
            className={styles['step-wrapper']}
        >
            <div className={styles.star}>
                {
                    filled
                        ? (
                            <StarFilled />
                        )
                        : (
                            <StarNonFilled />
                        )
                }
            </div>
            <div className={styles.separator} />
            <div className={styles.label}>
                {label}
            </div>
        </div>
    )
}
