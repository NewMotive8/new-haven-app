import React from 'react'
import { IntRange } from 'utils/globalTypes'
import styles from './star.progress.module.scss'
import StepStarProgress from './step'

export type progressBarStartSteps = { label: React.ReactNode, percentage: IntRange<0, 101> }

interface Props {
    progress: number,
    steps: Array<progressBarStartSteps>,
}

export default function StarProgressBar(props: Props) {
    const {
        steps,
        progress,
    } = props

    return (
        <div className={styles['main-wrapper']}>
            <div className={styles['bar-placeholder']}>
                <div
                    style={{
                        width: `${progress || 1}%`,
                    }}
                    className={styles['bar-progress']}
                />
            </div>
            {
                steps.map((step) => {
                    return (
                        <StepStarProgress
                            key={`${step.label}-${step.percentage}-${Math.random()}`}
                            filled={step.percentage < progress}
                            label={step.label}
                            position={step.percentage}
                        />
                    )
                })
            }
        </div>
    )
}
