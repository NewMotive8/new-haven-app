import { textTranslated } from 'components/TextTranslated'

import Card from 'components/cards/card'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import Typography from 'components/uiKit/typography'
import { useState } from 'react'
import { BsTools } from 'react-icons/bs'
import { useThemeWatcher } from 'utils/customHooks'

export default function AdvancedTab({
  updatePool,
  errors,
  setCurrentInfo,
  pool,
  index,
}: any) {
  const [expand, setExpand] = useState(false)

  const theme = useThemeWatcher()

  return (
    <Grid>
      <Grid>
        <Button
          color={theme === 'light' ? 'primary' : 'primary-full'}
          block
          onClick={() => setExpand(!expand)}
          id="advanced-toggle"
        >
          <Grid
            gap="0.5rem"
            verticalAlgin="center"
            horizontalAlgin="flex-start"
          >
            <BsTools />
            <Typography translateGroup="global" translateKey="advanced" />
          </Grid>
        </Button>
      </Grid>
      <Card
        color="root"
        style={{
          height: 'fit-content',
          maxHeight: expand ? '500px' : '0px',
          transition: 'max-height 0.5s ease-in-out',
          overflow: 'hidden',
          borderRadius: '0pt 0pt 4pt 4pt',
          padding: 0,
        }}
      >
        <Grid padding={['p-3']} width="calc(50% - 0.25rem)">
          <InputGroup
            id="maximumAmount"
            name="maximumAmount"
            label="maximum-pool-size"
            feedback={errors?.maximumAmount}
            status={errors?.maximumAmount && 'error'}
            value={pool.maximumAmount}
            inputType="number"
            onChange={({ target }) => {
              updatePool(target.name, target.value, index)
            }}
            onFocus={() => setCurrentInfo(
                textTranslated({
                  group: 'forms-tabs-helpers',
                  key: 'input-maximumAmount-help',
                  returnDefault: 'nothing',
                }),
              )}
          />
        </Grid>
      </Card>
    </Grid>
  )
}
