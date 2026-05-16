import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import React from 'react'

export default function ProductsHeader() {
    return (
        <Grid>
            <Typography
                translateGroup="products"
                translateKey="products"
                weight={600}
                elementType="h5"
                margin="mb-1"
                style={{
                    textTransform: 'capitalize',
                    width: '100%',
                }}
            />

            <Typography
                weight={400}
                elementType="p"
                margin="mb-3"
                style={{
                    textTransform: 'capitalize',
                }}
            >
                Global product catalog management
            </Typography>
        </Grid>
    )
}
