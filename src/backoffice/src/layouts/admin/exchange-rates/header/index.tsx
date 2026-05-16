import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import React from 'react'

export default function ExchangeRatesHeader() {
  return (
    <Grid>
      <Typography
        translateGroup="exchange-rates"
        translateKey="exchange-rates"
        weight={600}
        elementType="h5"
        margin="mb-1"
        style={{
          textTransform: 'capitalize',
          width: '100%',
        }}
      />

      <Typography
        translateGroup="exchange-rates"
        translateKey="exchange-rates-administration"
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
