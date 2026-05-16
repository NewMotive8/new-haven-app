import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import React from 'react'

export default function PlayerHeader() {
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
                Tournament Tickets
            </Typography>

            <Typography
                weight={400}
                elementType="p"
                margin="mb-3"
                style={{
                    textTransform: 'capitalize',
                }}
            >
                Tournament Tickets Administration
            </Typography>
        </Grid>
    )
}
