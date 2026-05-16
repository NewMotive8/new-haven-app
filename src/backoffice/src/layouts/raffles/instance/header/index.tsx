import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import React from 'react'

export default function InstanceHeader() {
    return (
        <Grid>
            <Typography
                weight={600}
                elementType="h5"
                margin="mb-1"
                style={{
                    textTransform: 'capitalize',
                    width: '100%',
                }}
            >
                Raffle Instances
            </Typography>

            <Typography
                weight={400}
                elementType="p"
                margin="mb-3"
                style={{
                    textTransform: 'capitalize',
                }}
            >
                Raffle Instances Administration
            </Typography>
        </Grid>
    )
}
