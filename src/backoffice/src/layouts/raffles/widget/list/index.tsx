import React, { useContext } from 'react'
import { BsPlusCircle } from 'react-icons/bs'
import Typography from 'components/uiKit/typography'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import DataGridV3 from 'components/uiKit/dataGridV3'
import widgetApi, { widgetI } from 'utils/services/api/requests/raffle-api/widget'
import { CrudContext } from '..'
import { columns } from './listSettings'

export default function ListCrud() {
  const { refreshState, setSelectedItem, raffleId } =
    useContext(CrudContext)

  const createNewWidget = () => {
    if (typeof raffleId !== 'number') return

    setSelectedItem({
      ...widgetApi.defaultItem,
      raffle: { id: raffleId },
    })
  }

  if (typeof raffleId !== 'number') {
    return null
  }

  return (
    <>
      {/* Add Widget Button */}
      <Grid horizontalAlgin="flex-end" margin="mb-3">
        <Button onClick={createNewWidget} color="primary" id="add-widget">
          <Grid wrap="nowrap" gap="0.25rem" horizontalAlgin="center">
            <BsPlusCircle />
            <Typography translateKey="add" weight={600} />
          </Grid>
        </Button>
      </Grid>

      {/* Widgets List */}
     <DataGridV3
  onRowClick={(row: widgetI) => setSelectedItem(row)}
  columns={columns}
  dataService={async () => {
    const widgets = await widgetApi.getByRaffle(raffleId)

    return {
      content: widgets,                //  REQUIRED
      totalElements: widgets.length,   //  REQUIRED for footer
      numberOfElements: widgets.length,
      totalPages: 1,
      first: true,
      last: true,
      empty: widgets.length === 0,
    }
  }}
  dataGridId={`widget-list-${raffleId}-${refreshState}`}
  enablePagination
/>



    </>
  )
}
