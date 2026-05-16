import TabSelector from 'components/selectors/tabSelector'
import DataGridV3 from 'components/uiKit/dataGridV3'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import React, { useContext, useEffect, useState } from 'react'
import { jackpotStatus, parseParamsToAddFilterByJackpotDash } from 'utils/functions/requests/requestParams'
import jackpotsApi from 'utils/services/api/requests/jackpots'
import { DashboardContext } from '..'
import { columns } from './listSettings'

interface filterTabsI {
  label: React.ReactNode;
  value: jackpotStatus;
}
const filterTabs: filterTabsI[] = [
  {
    label: <Typography translateGroup="jackpot-status" translateKey="active" />,
    value: 'active',
  },
  {
    label: (
      <Typography translateGroup="jackpot-status" translateKey="disabled" />
    ),
    value: 'disabled',
  },
]
export default function ListDash() {
  const { setCurrentJackpot } = useContext(DashboardContext)
  const [currentStatus, setCurrentStatus] = useState<filterTabsI>(
    filterTabs[0],
  )

  return (
    <>
      <Grid>
        <TabSelector
          currentTab={currentStatus}
          setCurrentTab={setCurrentStatus as any}
          tabs={filterTabs}
          orientation="horizontal"
        />
      </Grid>
      <DataGridV3
        onRowClick={(row: any) => setCurrentJackpot(row)}
        columns={columns}
        dataService={(p) => jackpotsApi.getItems(parseParamsToAddFilterByJackpotDash(currentStatus.value, p))}
        dataGridId={`jackpots-dash-${currentStatus.value}`}
      />
    </>
  )
}
