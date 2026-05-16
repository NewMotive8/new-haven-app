import React from 'react'
import Link from 'next/link'
import Typography from 'components/uiKit/typography'
import PrevArrow from 'assets/icons/prevArrow'
import NextArrow from 'assets/icons/nextArrow'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import styles from './styles.module.scss'

interface HeaderSectionProps {
    title?: React.ReactNode;
    realPosition: number;
    maxPosition: number;
    cardsInView: number;
    cardsLength: number;
    isMobile: boolean;
    handlePrevClick: () => void;
    handleNextClick: () => void;
    arrowPosition?: 'left' | 'right' | 'center';
}

export default function HeaderSection({
    title,
    realPosition,
    maxPosition,
    cardsInView,
    cardsLength,
    isMobile,
    handlePrevClick,
    handleNextClick,
    arrowPosition,
}: HeaderSectionProps) {
    const arrowPositionKey = {
        left: 'flex-start',
        right: 'flex-end',
        center: 'center',
    }

    return (
        <Grid wrap="nowrap" horizontalAlgin="space-between" verticalAlgin="stretch" padding={[]} className={styles.header}>
            <Grid
                verticalAlgin="center"
                width={title ? '100%' : '0%'}
            >
                {
                    typeof title === 'string'
                        ? (
                            <Typography
                                translateGroup="input-group-label"
                                translateKey={title}
                                weight={600}
                            />
                        )
                        : title
                }
            </Grid>
            <Grid
                wrap="nowrap"
                horizontalAlgin={(arrowPosition && arrowPositionKey[arrowPosition] as any) || 'flex-end'}
                verticalAlgin="center"
                gap="0.25rem"
            >
                {
                    cardsLength > cardsInView && (
                        <Grid
                            gap="0.25rem"
                            width="fit-content"
                        >
                            <PrevArrow cursor="pointer" width={30} isDisabled={!realPosition} onClick={handlePrevClick} />
                            <NextArrow cursor="pointer" width={30} isDisabled={(realPosition >= maxPosition)} onClick={handleNextClick} />
                        </Grid>
                    )
                }
            </Grid>
        </Grid>
    )
}
