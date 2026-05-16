import React from 'react'
import { CrudContext } from '../..'
import Grid from 'components/uiKit/grid'
import DataGridV2 from 'components/uiKit/dataGridV2'
import moment from 'moment'
import { BsCheckCircle, BsClock } from 'react-icons/bs'
import Badge from 'components/badge/Badge'
import { useThemeWatcher } from 'utils/customHooks'

export default function WinsTab() {
  const {
    selectedItem,
  } = React.useContext(CrudContext)

  const statusBadge = (status: string) => {
      const normalized = (status || '').toLowerCase()
      const theme = useThemeWatcher();
  if (normalized === 'processed') {
    return (
      <Badge
        text="Processed"
        icon={<BsCheckCircle size={14} />}
        iconColor={theme === "dark" ? '#8edfb0' : '#1f8e3e'} // lighter green in dark
        textColor={theme === "dark" ? '#c7f2d8' : '#064d1a'} // lighter but still green
        backgroundColor={theme === "dark" ? '#1f3f2a' : '#d8f7de'} // darker greenish bg in dark
      />
    )
  }
  if (normalized === 'unprocessed') {
    return (
      <Badge
        text="Unprocessed"
        icon={<BsClock size={14} />}
        iconColor={theme === "dark" ? '#ffcc80' : '#b36200'}
        textColor={theme === "dark" ? '#ffe5c2' : '#4a2a00'}
        backgroundColor={theme === "dark" ? '#4a320f' : '#ffe8c6'}
      />
    )
  }
  return (
    <Badge
      text={status}
      icon={<BsClock size={14} />}
      backgroundColor={theme === "dark" ? '#555' : '#6c757d'}
    />
  )
}


  return (
    <Grid>
      <DataGridV2
        data={selectedItem?.wins || []}
        columns={[
          {
            key: 'id',
            uniqueId: 'id',
            label: 'id',
            filter: true,
          },
          {
            key: 'instantWin',
            label: 'instant-win',
            uniqueId: 'instantWin',
            filter: true,
            render: (value: any) => moment.utc(value).format('YYYY-MM-DD HH:mm:ss'),
          },
          {
            key: 'status',
            label: 'status',
            uniqueId: 'status',
            filter: true,
            render: (value: any) => statusBadge(value),
          },
        ]}
      />
    </Grid>
  )
}
