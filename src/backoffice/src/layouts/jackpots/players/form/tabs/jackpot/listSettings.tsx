import { dataGridColumnType } from 'components/uiKit/dataGridV3'
import { BsCheckLg, BsX, BsXLg } from 'react-icons/bs'

export const columns: Array<dataGridColumnType> = [
  {
    key: 'internalName',
    label: 'Jackpot Name',
    uniqueId: 'internalName',
    filter: true,
  },
  {
    key: 'playerOption.optin',
    label: 'opt status',
    uniqueId: 'opt-status',
    filter: true,
    style: { maxWidth: '130px' },
    filterExactMatch: 'opt-in,opt-out',
    parseFilter: (value: string) => {
      return value === 'opt-in'
    },
    render: (v: any, row: any) => {
      return v ? (
        <>
          <BsCheckLg
            size="30px"
            color="var(--success)"
            style={{ marginLeft: '0.5rem', marginRight: '0.5rem' }}
          />
        </>
      ) : (
        <>
          <BsXLg
            size="30px"
            color="var(--danger)"
            style={{ marginLeft: '0.5rem', marginRight: '0.5rem' }}
          />
        </>
      )
    },
  },

]
