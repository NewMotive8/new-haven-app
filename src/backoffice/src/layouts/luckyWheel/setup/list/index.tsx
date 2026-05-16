import React, { useContext } from 'react'
import { BsPlusCircle } from 'react-icons/bs'
import Typography from 'components/uiKit/typography'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import DataGridV3 from 'components/uiKit/dataGridV3'
import { luckWheelApi } from 'utils/services/api/requests/luckWheel/wheel'
import { LWSetupContext } from '..'
import { columns } from './listSettings'

export default function ListCrud() {
  const { setSelectedItem } = useContext(LWSetupContext)
  return (
    <>
      <Grid horizontalAlgin="flex-end" margin="mb-3">
        <Button
          id="add-item-button"
          onClick={() => { setSelectedItem(luckWheelApi.defaultWheel) }}
          color="primary"
        >
          <Grid
            wrap="nowrap"
            gap="0.25rem"
            horizontalAlgin="center"
            verticalAlgin="center"
          >
            <BsPlusCircle />
            <Typography
              translateGroup="alerts"
              translateKey="add"
              weight={600}
            />
          </Grid>
        </Button>
      </Grid>
      <DataGridV3
        onRowClick={(row: any) => setSelectedItem(row)}
        columns={columns}
        dataService={(p) => luckWheelApi.getWheels(p)}
        dataGridId="lucky-wheels"
      />
    </>
  )
}
