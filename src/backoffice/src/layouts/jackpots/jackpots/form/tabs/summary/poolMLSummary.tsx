import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import React from 'react'
import { poolsI } from 'utils/services/api/requests/pools'
import styles from './styles.module.scss'

interface Props {
    pool: poolsI
}

export default function PoolMLSummary(props: Props) {
    const { pool } = props

    return (
        <>
            <Grid className={styles.row} gap="0.25rem" horizontalAlgin="space-between">
                <Typography size="md" translateGroup="jackpot-summary" translateKey="pool-contribution-amount" />
                <Typography weight={600}>
                    {`${pool.contributionAmount}${pool.contributionType === 2 ? ' %' : ''}`}
                </Typography>
            </Grid>
            <Grid className={styles.row} gap="0.25rem" horizontalAlgin="space-between">
                <Typography size="md" translateGroup="jackpot-summary" translateKey="pool-min-contribution-amount" />
                <Typography weight={600}>
                    {`${pool.minContributionAmount}`}
                </Typography>
            </Grid>
            <Grid className={styles.row} gap="0.25rem" horizontalAlgin="space-between">
                <Typography size="md" translateGroup="jackpot-summary" translateKey="pool-max-contribution-amount" />
                <Typography weight={600}>
                    {`${pool.maxContributionAmount}`}
                </Typography>
            </Grid>
            <Grid className={styles.row} gap="0.25rem" horizontalAlgin="space-between">
                <Typography size="md" translateGroup="jackpot-summary" translateKey="pool-min-amount" />
                <Typography weight={600}>
                    {`${pool.minimumAmount}`}
                </Typography>
            </Grid>
            <Grid className={styles.row} gap="0.25rem" horizontalAlgin="space-between">
                <Typography size="md" translateGroup="jackpot-summary" translateKey="pool-multi-level-weight" />
                <Typography weight={600}>
                    {`${pool.multiLevelWeight}`}
                </Typography>
            </Grid>
            <Grid className={styles.row} gap="0.25rem" horizontalAlgin="space-between">
                <Typography size="md" translateGroup="jackpot-summary" translateKey="pool-player-contribution" />
                <Typography weight={600}>
                    {`${pool.playerContributionPercent} %`}
                </Typography>
            </Grid>
            <Grid className={styles.row} gap="0.25rem" horizontalAlgin="space-between">
                <Typography size="md" translateGroup="jackpot-summary" translateKey="pool-operador-contribution" />
                <Typography weight={600}>
                    {`${pool.operatorContribution} %`}
                </Typography>
            </Grid>
        </>
    )
}
