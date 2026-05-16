import { dataGridColumnType } from 'components/uiKit/dataGridV3'

export function buildColumns(): Array<dataGridColumnType> {
  return [
    {
      key: 'id',
      uniqueId: 'id',
      label: 'Id',
      filter: true,
    },
    {
      key: 'name',
      uniqueId: 'name',
      label: 'Name',
      filter: true,
    },
    {
      key: 'entryOpenAtUtc',
      uniqueId: 'entry-open-at-utc',
      label: 'Entry Open (UTC)',
      filter: true,
    },
    {
      key: 'drawAtUtc',
      uniqueId: 'draw-at-utc',
      label: 'Draw At (UTC)',
      filter: true,
    },
    {
      key: 'maxEntriesPerPlayer',
      uniqueId: 'max-entries-per-player',
      label: 'Max Entries/Player',
      filter: true,
    },
    {
      key: 'allowMultipleEntriesPerTicket',
      uniqueId: 'allow-multiple-entries-per-ticket',
      label: 'Multi Entries/Ticket',
      filter: true,
    },
  ]
}
