import React, { useState, useContext, useCallback } from 'react'
import { CrudContext } from '../..'
import Grid from 'components/uiKit/grid'
import DataGridV2 from 'components/uiKit/dataGridV2'
import { BsCheckCircle, BsClock } from 'react-icons/bs'
import Badge from 'components/badge/Badge'
import { useThemeWatcher } from 'utils/customHooks'
import InstantWinModal from 'components/InstantWinModal/InstantWinModal'
import { updateInstantWin } from 'utils/services/api/requests/raffle-api/raffle'
import Typography from 'components/uiKit/typography'
import Button from 'components/uiKit/buttons'

export default function WinsTab() {
  const { selectedItem, setSelectedItem } = useContext(CrudContext)
  const theme = useThemeWatcher()

  const [editingRow, setEditingRow] = useState<any | null>(null)
  const [editingValue, setEditingValue] = useState<string | null>(null)

  const saveChange = useCallback(
  async (row: any, value: string) => {
    const payload = {
      ...row,
      instantWin: value,
    }

    const success = await updateInstantWin(row.id, payload)

    if (success) {
      setSelectedItem((prev: any) => ({
        ...prev,
        wins: prev.wins.map((w: any) =>
          w.id === row.id
            ? { ...w, instantWin: value }
            : w
        ),
      }))

      setEditingRow(null)
      setEditingValue(null)
    }
  },
  [setSelectedItem]
)


  const statusBadge = useCallback((status: string) => {
    const normalized = (status || '').toLowerCase()

    if (normalized === 'processed') {
      return (
        <Badge
          text="Processed"
          icon={<BsCheckCircle size={14} />}
          iconColor={theme === "dark" ? '#8edfb0' : '#1f8e3e'}
          textColor={theme === "dark" ? '#c7f2d8' : '#064d1a'}
          backgroundColor={theme === "dark" ? '#1f3f2a' : '#d8f7de'}
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

    return <Badge text={status} icon={<BsClock size={14} />} />
  }, [theme])

  const instantWinCell = useCallback((value: string, row: any) => {
  return (
    <Button
      type="button"
      style={{
        background: 'transparent',
        border: 0,
        padding: 0,
        cursor: 'pointer',
        color: 'inherit',
        font: 'inherit',
        textAlign: 'left',
        whiteSpace: 'nowrap',      // keeps text in a single line
        display: 'inline-block',   // ensures consistent layout
      }}
      onClick={() => {
        setEditingRow(row)
        setEditingValue(value)
      } } id={''}    >
      {value || '—'}
    </Button>
  )
}, [])


  return (
    <Grid>
      <DataGridV2
        data={selectedItem?.wins || []}
        columns={[
          { key: 'id', label: 'ID', uniqueId: 'id', filter: true},
          {
            key: 'instantWin',
            label: 'Instant Win',
            uniqueId: 'instantWin',
            render: instantWinCell,
            avoidRowClick: true,
          },
          {
            key: 'status',
            label: 'status',
            uniqueId: 'status',
            filter: true,
            render: (value: string) => statusBadge(value),
          },
        ]}
      />

      {editingRow && (
        <InstantWinModal
          value={editingValue}
          onClose={() => {
            setEditingRow(null)
            setEditingValue(null)
          }}
          onSave={(val) => saveChange(editingRow, val)}
        />
      )}
    </Grid>
  )
}
