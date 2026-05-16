import React, { useContext, useState } from 'react'
import Typography from 'components/uiKit/typography'
import Grid from 'components/uiKit/grid'
import DataGridV3 from 'components/uiKit/dataGridV3'
import TypeButton from 'components/uiKit/inputs/TypeButton'
import winsApi from 'utils/services/api/requests/wins'
import { parseParamsToAddFilterByApproved } from 'utils/functions/requests/requestParams'
import { CrudContext } from '..'
import { columns, unapprovedColumns } from './listSettings'

export default function ListCrud() {
  const { refreshState, askRefresh, setLoading } = useContext(CrudContext)
  const [approvedStatus, setApprovedStatus] = useState(false)

  // Ensure we always pass a function to columns
  const onRefresh = askRefresh ?? (() => {})

  return (
    <>
      {/* APPROVED / UNAPPROVED FILTER */}
      <Grid margin="mb-3">
        <TypeButton
          name="approvedStatus"
          value={approvedStatus}
          onChange={({ target }) => setApprovedStatus(target.value)}
          options={[
            { label: <Typography translateGroup="global" translateKey="unapproved" />, value: false },
            { label: <Typography translateGroup="global" translateKey="approved" />, value: true },
          ]}
        />
      </Grid>

      {/* DATA GRID */}
      <DataGridV3
        onRowClick={() => {}}
        columns={approvedStatus ? columns : unapprovedColumns(onRefresh, setLoading)} // ✅ pass setLoading
        dataService={(params) => {
          if (setLoading) setLoading(true)
          return winsApi.getItems(parseParamsToAddFilterByApproved(approvedStatus, params))
            .finally(() => { if (setLoading) setLoading(false) })
        }
        }
        dataGridId={`wins-${refreshState}-${approvedStatus}`}
      />
    </>
  )
}
