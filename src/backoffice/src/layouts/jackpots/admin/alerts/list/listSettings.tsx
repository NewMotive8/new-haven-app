import { dataGridColumnType } from 'components/uiKit/dataGridV3'
import { BsCheck, BsX } from 'react-icons/bs'

export const columns: Array<dataGridColumnType> = [
  {
    label: 'enabled',
    key: 'enabled',
    uniqueId: 'enabled',
    filter: false,
    style: {
      width: '20%',
    },
    render: (v: any, row: any) => (row?.enabled ? (
        <>
          <BsCheck size="1.4rem" fill="var(--success)" />
          {v}
        </>
      ) : (
        <>
          <BsX size="1.4rem" fill="var(--danger)" />
          {v}
        </>
      )),
  },
  {
    label: 'Alert Rule',
    key: 'alertRule',
    uniqueId: 'alertRule',
    filter: true,
  },
  {
    label: 'Rule Input',
    key: 'ruleInput',
    uniqueId: 'ruleInput',
    filter: true,
    style: {
      width: '25%',
    },
  },
  {
    label: 'Interval',
    key: 'interval',
    uniqueId: 'interval',
    filter: true,
    style: {
      width: '25%',
    },
  },
  {
    label: 'Email List',
    key: 'emailList',
    uniqueId: 'emailList',
    filter: true,
  },
]
