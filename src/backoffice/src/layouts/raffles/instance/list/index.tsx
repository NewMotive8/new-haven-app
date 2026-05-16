import React, { useContext } from 'react'
import { BsPlusCircle } from 'react-icons/bs'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import DataGridV3 from 'components/uiKit/dataGridV3'
import instanceApi from 'utils/services/api/requests/raffle-api/instance'
import { CrudContext } from '..'
import { buildColumns } from './listSettings'

function createNewInstanceWithDefaults(raffleId: number) {
  const now = new Date().toISOString().slice(0, 16)
  return {
    ...instanceApi.defaultItem,
    raffleId,
    entryOpenAtUtc: now,
    drawAtUtc: now,
  }
}

export default function ListCrud() {
  const { refreshState, setSelectedItem, raffleId } = useContext(CrudContext)

  return (
    <>
      <Grid horizontalAlgin="flex-end" margin="mb-3">
        <Button
          id="add-item-button"
          onClick={() => {
            if (raffleId === undefined) return
            setSelectedItem(createNewInstanceWithDefaults(raffleId))
          }}
          color="primary"
        >
          <Grid wrap="nowrap" gap="0.25rem" horizontalAlgin="center" verticalAlgin="center">
            <BsPlusCircle />
            <Typography translateGroup="raffle-instance" translateKey="add" weight={600} />
          </Grid>
        </Button>
      </Grid>
      <DataGridV3
        onRowClick={(row: any) => setSelectedItem(row)}
        columns={buildColumns()}
        dataService={async (p) => {
          const filterExp = raffleId
            ? p?.filterExp
              ? `${p.filterExp}[and]raffle.id$eq=${raffleId}`
              : `raffle.id$eq=${raffleId}`
            : p?.filterExp
          return instanceApi.getItems({ ...p, filterExp })
        }}
        dataGridId={`instance-${refreshState}`}
        enablePagination
      />
    </>
  )
}
