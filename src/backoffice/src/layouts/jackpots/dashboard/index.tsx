import Card from 'components/cards/card'
import Grid from 'components/uiKit/grid'
import BrandContext from 'context/brand'
import React, { useContext, useState } from 'react'
import { jackpotsI } from 'utils/services/api/requests/jackpots'
import DashboardHeader from './header'
import ListDash from './list'
import ChartsSection from './reports'

interface dashboardContextI {
  currentJackpot?: jackpotsI | null;
  setCurrentJackpot: React.Dispatch<
    React.SetStateAction<jackpotsI | null | undefined>
  >;
}

export const DashboardContext = React.createContext<dashboardContextI>({
  setCurrentJackpot: () => {},
})

export default function DashBoard() {
  const [currentJackpot, setCurrentJackpot] = useState<jackpotsI | null>()
  const { currentBrand } = useContext(BrandContext)
  return (
    <DashboardContext.Provider
      value={{
        currentJackpot,
        setCurrentJackpot,
      }}
    >
      <Card color="secondary">
        <DashboardHeader />
        <Grid hidden={!!currentJackpot || !currentBrand}>
          <ListDash />
        </Grid>
        <Grid hidden={!currentJackpot}>
          <ChartsSection />
        </Grid>
      </Card>
    </DashboardContext.Provider>
  )
}
