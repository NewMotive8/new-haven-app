import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import React from 'react'

export default function SegmentsHeader() {
    return (
        <Grid>
            <Typography
                translateGroup="segments"
                translateKey="segments"
                weight={600}
                elementType="h5"
                margin="mb-1"
                style={{
                    textTransform: 'capitalize',
                    width: '100%',
                }}
            />

            <Typography
                translateGroup="segments"
                translateKey="segments-administration"
                weight={400}
                elementType="p"
                margin="mb-3"
                style={{
                    textTransform: 'capitalize',
                }}
            />
        </Grid>
    )
}
