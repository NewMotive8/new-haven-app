import { dataGridColumnType } from 'components/uiKit/dataGridV3'

export const columns: Array<dataGridColumnType> = [
  {
    label: 'id',
    key: 'id',
    uniqueId: 'id',
    filter: true,

  },
  {
    label: 'internal name',
    key: 'internalName',
    uniqueId: 'internalName',
    filter: true,
  },
  {
    label: 'internal Description',
    key: 'internalDescription',
    uniqueId: 'internalDescription',
    filter: true,
  },
]
