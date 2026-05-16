import { textTranslated } from 'components/TextTranslated'
import Grid from 'components/uiKit/grid'
import TypeButton from 'components/uiKit/inputs/TypeButton'
import Typography from 'components/uiKit/typography'
import { PoolType } from 'utils/services/api/requests/pools'

interface Props {
  selectedType: PoolType
  setCurrentInfo: Function
  readonly: boolean
  updatePool: Function
  index: number
}

export default function SelectContributionType(props: Props) {
  const {
 selectedType, setCurrentInfo, readonly, updatePool, index,
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
            key: 'pool-contribution-help',
            returnDefault: 'nothing',
          }),
        )}
    >
      <TypeButton
        value={selectedType}
        name="poolType"
        onChange={({ target }) => updatePool('contributionType', target.value, index)}
        options={[
          {
            label: (
              <Grid
                width="fit-content"
                onClick={() => setCurrentInfo(
                    textTranslated({
                      group: 'forms-tabs-helpers',
                      key: 'pool-contribution-fixed-help',
                      returnDefault: 'nothing',
                    }),
                  )}
              >
                <Typography translateGroup="pool-form" translateKey="fixed" />
              </Grid>
            ),
            value: PoolType.Fixed,
          },
          {
            label: (
              <Grid
                width="fit-content"
                onClick={() => setCurrentInfo(
                    textTranslated({
                      group: 'forms-tabs-helpers',
                      key: 'pool-contribution-percentage-help',
                      returnDefault: 'nothing',
                    }),
                  )}
              >
                <Typography
                  translateGroup="pool-form"
                  translateKey="percentage"
                />
              </Grid>
            ),
            value: PoolType.Percentage,
          },
        ]}
      />
    </Grid>
  )
}
