import { textTranslated } from 'components/TextTranslated'
import Grid from 'components/uiKit/grid'
import TypeButton from 'components/uiKit/inputs/TypeButton'
import Typography from 'components/uiKit/typography'
import React from 'react'
import { SeedType } from 'utils/services/api/requests/seeds'

interface Props {
  selectedType: SeedType
  setCurrentInfo: Function
  readonly: boolean
  index: number
  updateSeed: Function
}

export default function SelectContributionType(props: Props) {
  const {
    selectedType,
    setCurrentInfo,
    readonly,
    updateSeed,
    index,
  } = props

  return (
    <Grid
      style={{
        opacity: readonly ? 0.7 : 1,
        pointerEvents: readonly ? 'none' : 'unset',
      }}
      onMouseEnter={() => setCurrentInfo(
          textTranslated({
            group: 'forms-tabs-helpers',
            key: 'seed-contribution-help',
            returnDefault: 'nothing',
          }),
        )}
    >
      <TypeButton
        value={selectedType}
        name="seedType"
        onChange={({ target }) => updateSeed('type', target.value, index)}
        options={[
          {
            label: (
              <Grid
                width="fit-content"
                onClick={() => setCurrentInfo(
                    textTranslated({
                      group: 'forms-tabs-helpers',
                      key: 'seed-contribution-fixed-help',
                      returnDefault: 'nothing',
                    }),
                  )}
              >
                <Typography translateGroup="seed-form" translateKey="fixed" />
              </Grid>
            ),
            value: SeedType.Fixed,
          },
          {
            label: (
              <Grid
                width="fit-content"
                onClick={() => setCurrentInfo(
                    textTranslated({
                      group: 'forms-tabs-helpers',
                      key: 'seed-contribution-percentage-help',
                      returnDefault: 'nothing',
                    }),
                  )}
              >
                <Typography
                  translateGroup="seed-form"
                  translateKey="percentage"
                />
              </Grid>
            ),
            value: SeedType.Percentage,
          },
        ]}
      />
    </Grid>
  )
}
