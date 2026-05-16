import React, { useContext } from 'react'
import Grid from 'components/uiKit/grid'
import WidgetCrud from 'layouts/jackpotRaces/widget'
import { CrudContext as JackpotRaceContext } from '../../../../../../layouts/jackpotRaces/jackpotRace/index'
import { jackpotRaceI } from 'utils/services/api/requests/jackpot-race-api/jackpotRace'
import Typography from 'components/uiKit/typography'

export default function WidgetSettingsTab() {
  const jackpotRaceContext = useContext(JackpotRaceContext)

  // ✅ Guard against missing provider
  if (!jackpotRaceContext) {
    return null
  }

  const { selectedItem } = jackpotRaceContext as {
    selectedItem: jackpotRaceI | null
  }

  // SpinSprint / JackpotRace must be saved first
  if (!selectedItem?.id) {
    return (
      <Grid>
         <Typography
            translateGroup="jackpot-race-widget"
            translateKey="select-or-save-jackpot-first"
         />
      </Grid>
    )
  }

  // ✅ Pass parent entity ID into widget CRUD
  return <WidgetCrud spinSprintId={selectedItem.id} />
}
