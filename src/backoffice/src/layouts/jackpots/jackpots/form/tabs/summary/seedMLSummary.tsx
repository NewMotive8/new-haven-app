import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import React from 'react'
import { seedsI } from 'utils/services/api/requests/seeds'
import styles from './styles.module.scss'

interface Props {
    seed: seedsI
}

export default function SeedMLSummary(props: Props) {
    const { seed } = props

    return (
        <>
            <Grid className={styles.row} gap="0.25rem" horizontalAlgin="space-between">
                <Typography size="md" translateGroup="jackpot-summary" translateKey="seed-contribution-amount" />
                <Typography weight={600}>
                    {`${seed.contributionAmount}${seed.type === 2 ? ' %' : ''}`}
                </Typography>
            </Grid>
            <Grid className={styles.row} gap="0.25rem" horizontalAlgin="space-between">
                <Typography size="md" translateGroup="jackpot-summary" translateKey="seed-min-contribution-amount" />
                <Typography weight={600}>
                    {`${seed.minContributionAmount}`}
                </Typography>
            </Grid>
            <Grid className={styles.row} gap="0.25rem" horizontalAlgin="space-between">
                <Typography size="md" translateGroup="jackpot-summary" translateKey="seed-max-contribution-amount" />
                <Typography weight={600}>
                    {`${seed.maxContributionAmount}`}
                </Typography>
            </Grid>
            <Grid className={styles.row} gap="0.25rem" horizontalAlgin="space-between">
                <Typography size="md" translateGroup="jackpot-summary" translateKey="seed-min-amount" />
                <Typography weight={600}>
                    {`${seed.minimumAmount}`}
                </Typography>
            </Grid>
            <Grid className={styles.row} gap="0.25rem" horizontalAlgin="space-between">
                <Typography size="md" translateGroup="jackpot-summary" translateKey="seed-multi-level-target-amount" />
                <Typography weight={600}>
                    {`${seed.targetAmount || 0}`}
                </Typography>
            </Grid>
            <Grid className={styles.row} gap="0.25rem" horizontalAlgin="space-between">
                <Typography size="md" translateGroup="jackpot-summary" translateKey="seed-player-contribution" />
                <Typography weight={600}>
                    {`${seed.playerContributionPercent} %`}
                </Typography>
            </Grid>
            <Grid className={styles.row} gap="0.25rem" horizontalAlgin="space-between">
                <Typography size="md" translateGroup="jackpot-summary" translateKey="seed-operador-contribution" />
                <Typography weight={600}>
                    {`${seed.operatorContribution} %`}
                </Typography>
            </Grid>
        </>
    )
}
