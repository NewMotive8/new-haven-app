import React, { useContext } from 'react'
import Grid from 'components/uiKit/grid'
import WidgetCrud from 'layouts/raffles/widget'
import { CrudContext as RaffleContext } from '../../../../../../layouts/raffles/raffle/index'
import { raffleI } from 'utils/services/api/requests/raffle-api/raffle'
import Typography from 'components/uiKit/typography'

export default function WidgetSettingsTab() {
  const raffleContext = useContext(RaffleContext)

  // ✅ Guard against missing provider
  if (!raffleContext) {
    return null
  }

  const { selectedItem } = raffleContext as {
    selectedItem: raffleI | null
  }

  // Raffle / Raffle must be saved first
  if (!selectedItem?.id) {
    return (
      <Grid>
         <Typography
            translateGroup="raffle-widget"
            translateKey="select-or-save-raffle-first"
         />
      </Grid>
    )
  }

  // ✅ Pass parent entity ID into widget CRUD
  return <WidgetCrud raffleId={selectedItem.id} />
}
