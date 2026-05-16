import { textTranslated } from 'components/TextTranslated'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'

export type DropTypesT = 'single' | 'Daily' | 'Weekly' | 'Monthly' |'many'
export type OptionValueT = 1 | 2 | 3 | 4 |5
interface DataOptionsProps {
  label: any
  value: OptionValueT
}
interface OptionsProps {
  setCurrentInfo: Function
}
export function options({
  setCurrentInfo,
}: OptionsProps): Array<DataOptionsProps> {
  return [
    {
      label: (
        <Grid
          width="fit-content"
          onClick={() => setCurrentInfo(
              textTranslated({
                group: 'forms-helpers',
                key: 'schedule-must-drop-type-single',
                returnDefault: 'nothing',
              }),
            )}
        >
          <Typography
            translateGroup="schedule-must-drop-type"
            translateKey="single"
          />
        </Grid>
      ),
      value: 1,
    },
    {
      label: (
        <Grid
          width="fit-content"
          onClick={() => setCurrentInfo(
              textTranslated({
                group: 'forms-helpers',
                key: 'schedule-must-drop-type-daily',
                returnDefault: 'nothing',
              }),
            )}
        >
          <Typography
            translateGroup="schedule-must-drop-type"
            translateKey="Daily"
          />
        </Grid>
      ),
      value: 2,
    },
    {
      label: (
        <Grid
          width="fit-content"
          onClick={() => setCurrentInfo(
              textTranslated({
                group: 'forms-helpers',
                key: 'schedule-must-drop-type-Weekly',
                returnDefault: 'nothing',
              }),
            )}
        >
          <Typography
            translateGroup="schedule-must-drop-type"
            translateKey="Weekly"
          />
        </Grid>
      ),
      value: 3,
    },
    {
      label: (
        <Grid
          width="fit-content"
          onClick={() => setCurrentInfo(
              textTranslated({
                group: 'forms-helpers',
                key: 'schedule-must-drop-type-monthly',
                returnDefault: 'nothing',
              }),
            )}
        >
          <Typography
            translateGroup="schedule-must-drop-type"
            translateKey="Monthly"
          />
        </Grid>
      ),
      value: 4,
    },
  ]
}
