import React, { useContext, useEffect } from 'react'
import Grid from 'components/uiKit/grid'
import { textTranslated } from 'components/TextTranslated'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import InfoCard from 'components/cards/infoCard'
import Toggle from 'components/uiKit/inputs/Toggle'
import { FormContext } from '..'
import { CrudContext, FooterStatus } from '../..'

export default function BasicTab() {
  const { selectedItem } = React.useContext(CrudContext)
  const { errors, updateField, setCurrentInfo } = useContext(FormContext)
  const { handelerOptionSet } = useContext(CrudContext)

  useEffect(() => {
    handelerOptionSet({
      isCancel: true,
      isDelete: true,
      isSave: true,
    } as FooterStatus)
  }, [])
  return (
    <Grid gap="0.5rem">
      <Grid
        responsiveWidth={{ sm: 100, md: 'calc(100% - 0.25rem)' }}
        gap="0.5rem"
      >
        <InfoCard
          icon=""
          label="Total Won"
          value={`${selectedItem?.totalWinnings}` || ''}
          color="primary-outline"
          width="250px"
        />
        <InfoCard
          icon=""
          label="Total Wins"
          value={`${selectedItem?.totalWins}` || ''}
          color="primary-outline"
          width="250px"
        />
      </Grid>
      <Grid
        responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}
        gap="0.5rem"
      >
        <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
          <InputGroup
            id="brandPlayerId"
            name="brandPlayerId"
            label="brandPlayerId"
            feedback={errors?.brandPlayerId}
            status={errors?.brandPlayerId && 'error'}
            value={selectedItem.brandPlayerId}
            onChange={({ target }) => {
              updateField(target.name, target.value)
            }}
            onFocus={() => setCurrentInfo(
                textTranslated({
                  group: 'forms-tabs-helpers',
                  key: 'input-brandPlayerId-help',
                  returnDefault: 'nothing',
                }),
              )}
          />
        </Grid>
        <Grid
          responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}
          style={{ position: 'relative', left: 0, top: '-2rem' }}
        >
          <Toggle
            onChange={({ target }: any) => {
              updateField(target.name, target.value)
            }}
            value={selectedItem.enabled}
            id="enabled"
            name="enabled"
            label="enabled"
          />
        </Grid>
      </Grid>
    </Grid>
  )
}
