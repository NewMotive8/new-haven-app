import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import React from 'react'

export default function PropertiesHeader() {
  return (
    <Grid>
      <Typography
        translateGroup="properties"
        translateKey="properties"
        weight={600}
        elementType="h5"
        margin="mb-1"
        style={{
          textTransform: 'capitalize',
          width: '100%',
        }}
      />
      <Typography
        translateGroup="properties"
        translateKey="properties-administration"
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
