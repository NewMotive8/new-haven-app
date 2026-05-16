import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import React from 'react'

export default function PlayerwinsHeader() {
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
                Tournament Player Wins
            </Typography>

            <Typography
                weight={400}
                elementType="p"
                margin="mb-3"
                style={{
                    textTransform: 'capitalize',
                }}
            >
                Tournament Player Wins Administration
            </Typography>
        </Grid>
    )
}
