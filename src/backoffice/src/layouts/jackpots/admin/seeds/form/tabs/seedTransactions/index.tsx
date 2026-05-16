import DataGridV3 from 'components/uiKit/dataGridV3'
import Grid from 'components/uiKit/grid'
import React, { useState } from 'react'
import seedTransactionApi from 'utils/services/api/requests/seedTransaction'
import { CrudContext } from '../../..'
import { columns } from './listSettings'
import exportsApi from 'utils/services/api/requests/export-csv/exports'
import Button from 'components/uiKit/buttons'
import { textTranslated } from 'components/TextTranslated'

export default function SeedTransactionsTab() {
  const { selectedItem } = React.useContext(CrudContext)
  const [loading, setLoading] = useState(false)

  const handleGenerateReport = async () => {
  if (!selectedItem?.id) return
  setLoading(true)
  await exportsApi.generateSeedTransactionsReport(selectedItem.id)
  setLoading(false)
}

  return (
    <Grid gap="0.5rem">
       <Button
              id="generate-csv-report-button"
              onClick={handleGenerateReport}
              disabled={loading || !selectedItem}
              color="primary"
            >
             {loading ? textTranslated({
                         group: 'toast-notifications',
                         key: 'generating-report',
                       }) : textTranslated({
                         group: 'toast-notifications',
                         key: 'generate-report',
                       })}
            </Button>
      <DataGridV3
        dataService={async (p) => seedTransactionApi.getItems(selectedItem.id, p)}
        columns={columns}
        dataGridId="seedTransaction"
        defaultPageSize={10}
        enablePagination
      />
    </Grid>
  )
}
