import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import moment from 'moment'
import { useEffect, useState } from 'react'
import { BsClock } from 'react-icons/bs'

export function Clock() {
  const [hourUTC, setHourUTC] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      const now = moment().utc()
      const hourFormat = now.format('HH:mm:ss [UTC]')
      setHourUTC(hourFormat)
    }, 1000)

    return () => clearInterval(interval)
  }, [])
  return (
    <Grid
      responsiveWidth={{ sm: '100%' }}
      verticalAlgin="center"
      gap="0.2rem"
      horizontalAlgin="flex-end"
    >
      <BsClock size="0.8rem" />
      <Typography size="sm">{hourUTC}</Typography>
    </Grid>
  )
}
