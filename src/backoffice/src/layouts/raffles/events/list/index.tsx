import React, { useContext } from 'react'
import { BsPlusCircle, BsUpload } from 'react-icons/bs'
import Typography from 'components/uiKit/typography'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import DataGridV3 from 'components/uiKit/dataGridV3'
import eventsApi from 'utils/services/api/requests/raffle-api/events'
import DialogContext from 'context/dialog'
import DialogUpload from 'components/dialogUpload'
import { CrudContext } from '..'
import { columns } from './listSettings'

export default function ListCrud() {
  const { refreshState, setSelectedItem } = useContext(CrudContext)
  const { displayDialog } = useContext(DialogContext)

  function handleUploadFile() {
    displayDialog({
      dialogId: 'UPLOAD-FILE',
      content: <DialogUpload translateGroup="event-list" />,
    })
  }
  return (
    <>
      <Grid horizontalAlgin="flex-end" margin="mb-3" gap="0.5rem">
        <Button
          id="add-item-button"
          onClick={() => handleUploadFile()}
          color="primary"
        >
          <Grid
            wrap="nowrap"
            gap="0.25rem"
            horizontalAlgin="center"
            verticalAlgin="center"
          >
            <BsUpload />
            <Typography
              translateGroup="global"
              translateKey="events-upload-list"
              weight={600}
            />
          </Grid>
        </Button>
        <Button
          id="add-item-button"
          onClick={() => {
            setSelectedItem(eventsApi.defaultItem)
          }}
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
              translateGroup="event"
              translateKey="add"
              weight={600}
            />
          </Grid>
        </Button>
      </Grid>
      <DataGridV3
        onRowClick={(row: any) => setSelectedItem(row)}
        columns={columns}
        dataService={(p) => eventsApi.getItems(p)}
        dataGridId={`events-${refreshState}`}
        enablePagination
      />
    </>
  )
}
