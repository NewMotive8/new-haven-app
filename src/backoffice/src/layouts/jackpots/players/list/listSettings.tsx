import { dataGridColumnType } from 'components/uiKit/dataGridV3'
import { BsCheckLg, BsXLg } from 'react-icons/bs'

export const columns: Array<dataGridColumnType> = [
  {
    key: 'brandPlayerId',
    uniqueId: 'brandPlayerId',
    label: 'brand-player-id',
    filter: true,
    render: (v: any, row: any) => {
      return row?.enabled ? (
        <>
          <BsCheckLg
            size="0.8rem"
            style={{ marginLeft: '0.5rem', marginRight: '0.5rem' }}
          />
          {` ${v}`}
        </>
      ) : (
        <>
          <BsXLg
            size="0.8rem"
            style={{ marginLeft: '0.5rem', marginRight: '0.5rem' }}
          />
          {` ${v}`}
        </>
      )
    },
  },
  {
    key: 'totalWins',
    uniqueId: 'totalWins',
    label: 'total-wins',
    filter: true,
  },
]
