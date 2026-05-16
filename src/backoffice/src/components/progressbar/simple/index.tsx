import Typography from 'components/uiKit/typography'
import React, { CSSProperties } from 'react'
import styles from './progress.simple.module.scss'

interface Props {
    label: React.ReactNode,
    percent: number,
    wrapperStyles?: CSSProperties
    progressStyles?: CSSProperties,
    onClick?: Function,

}

export default function SimpleProgress(props: Props) {
    const {
        label,
        percent,
        wrapperStyles,
        progressStyles,
        onClick,
    } = props

    return (
        <div
            style={{ ...wrapperStyles, cursor: onClick ? 'pointer' : 'default' }}
            className={styles['progress-wrapper']}
            onClick={() => onClick && onClick()}
        >
            <div className={styles.header}>
                <div className={styles.label}>
                    <Typography size="sm" weight={600}>{label}</Typography>
                </div>
                <div className={styles.percent}>
                    <Typography size="sm" weight={600}>{`${percent}%`}</Typography>
                </div>
            </div>
            <div className={styles['progress-placeholder']}>
                <div
                    className={styles.progress}
                    style={{
                        ...progressStyles,
                        width: `${percent}%`,
                    }}
                    id={`simple-progress-${percent}`}
                />
            </div>
        </div>
    )
}
