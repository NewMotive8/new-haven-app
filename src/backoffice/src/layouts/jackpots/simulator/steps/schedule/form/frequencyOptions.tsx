import Typography from 'components/uiKit/typography'

export const frequencyOptions = [
  {
    label: (
      <Typography
        translateGroup="frequency-schedule-options"
        translateKey="DAILY"
      />
    ),
    value: 'DAILY',
  },
  {
    label: (
      <Typography
        translateGroup="frequency-schedule-options"
        translateKey="WEEKLY"
      />
    ),
    value: 'WEEKLY',
  },
  {
    label: (
      <Typography
        translateGroup="frequency-schedule-options"
        translateKey="MONTHLY"
      />
    ),
    value: 'MONTHLY',
  },
]

export const weeklyOptions = [
  {
    label: (
      <Typography
        translateGroup="frequency-schedule-weekly-options"
        translateKey="Monday"
      />
    ),
    value: 1,
  },
  {
    label: (
      <Typography
        translateGroup="frequency-schedule-weekly-options"
        translateKey="Tuesday"
      />
    ),
    value: 2,
  },
  {
    label: (
      <Typography
        translateGroup="frequency-schedule-weekly-options"
        translateKey="Wednesday"
      />
    ),
    value: 3,
  },
  {
    label: (
      <Typography
        translateGroup="frequency-schedule-weekly-options"
        translateKey="Thursday"
      />
    ),
    value: 4,
  },
  {
    label: (
      <Typography
        translateGroup="frequency-schedule-weekly-options"
        translateKey="Friday"
      />
    ),
    value: 5,
  },
  {
    label: (
      <Typography
        translateGroup="frequency-schedule-weekly-options"
        translateKey="Saturday"
      />
    ),
    value: 6,
  },
  {
    label: (
      <Typography
        translateGroup="frequency-schedule-weekly-options"
        translateKey="Sunday"
      />
    ),
    value: 7,
  },
]

const generateDaysOptions = () => {
  const daysOptions = []
  for (let i = 1; i <= 31; i += 1) {
    daysOptions.push({
      label: i,
      value: i,
    })
  }
  return daysOptions
}

export const daysOptions = generateDaysOptions()
