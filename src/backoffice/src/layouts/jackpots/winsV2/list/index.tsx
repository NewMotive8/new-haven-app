import React, { useContext } from 'react'
import Grid from 'components/uiKit/grid'
import DataGridV3 from 'components/uiKit/dataGridV3'
import winsApi from 'utils/services/api/requests/winsV2'
import { DownloadCSVButton } from 'components/downloadCSVButton'
import BrandContext from 'context/brand'
import { CrudContext } from '..'
import { columns } from './listSettings'

export default function ListCrud() {
  const { refreshState, setSelectedItem, selectedItem } = useContext(CrudContext)
  const { brandId } = useContext(BrandContext)
  const getCsvBlob = async () => {
    if (!brandId) {
        return null
    }
    const response = await winsApi.getCsv(brandId)
    return response
  }
  return (
    <>
      <Grid horizontalAlgin="flex-end" margin="mb-3">
        <DownloadCSVButton getCsvBlob={getCsvBlob} fileName="winners.csv" disabled={!brandId} />
        {/* <Button
          id="add-item-button"
          onClick={() => {
            setSelectedItem(winsApi.defaultItem)
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
              translateGroup="global"
              translateKey="add"
              weight={600}
            />
          </Grid>
        </Button> */}
      </Grid>
      <DataGridV3
        onRowClick={(row: any) => setSelectedItem(row)}
        columns={columns}
        dataService={(p) => winsApi.getItems(p)}
        dataGridId={`wins-${refreshState}`}
        enablePagination
      />
    </>
  )
}
