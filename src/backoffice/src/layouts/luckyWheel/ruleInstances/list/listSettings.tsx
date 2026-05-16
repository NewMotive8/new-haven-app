import { dataGridColumnType } from 'components/uiKit/dataGridV2';
import Grid from 'components/uiKit/grid';
import moment from 'moment';
import {
  BsCheck,
  BsX
} from 'react-icons/bs';

export const columns: Array<dataGridColumnType> = [
  {
    label: 'id',
    key: 'id',
    uniqueId: 'id',
    filter: true,
  },
  {
    label: 'internal name',
    key: 'name',
    uniqueId: 'name',
    filter: true,
  },

  {
    label: 'variableInput',
    key: 'variableInput',
    uniqueId: 'variableInput',
    filter: true,
  },
  {
    label: 'brandId',
    key: 'brandId',
    uniqueId: 'brandId',
    filter: true,
  },
  {
    label: 'enabled',
    key: 'enabled',
    uniqueId: 'enabled',
    filter: false,
    style: { maxWidth: '60px' },
    render: (enabled: boolean) => {
      if (enabled === true) {
        return (
          <Grid
            wrap='nowrap'
            gap='0.25rem'
            horizontalAlgin='center'
            verticalAlgin='center'
          >
            <BsCheck fill='var(--success)' size='1.4rem' />
          </Grid>
        );
      }
      if (enabled === false) {
        return (
          <Grid
            wrap='nowrap'
            gap='0.25rem'
            horizontalAlgin='center'
            verticalAlgin='center'
          >
            <BsX fill='var(--danger)' size='1.4rem' />
          </Grid>
        );
      }
    },
  },
  {
    label: 'expiryDate',
    key: 'expiryDate',
    uniqueId: 'expiryDate',
    filter: false,
    render: (value: any) =>
      !!value ? moment.utc(value).format('DD/MM/YYYY HH:mm:ss') : '',
    parseFilter: (value: any) => moment.utc(value).format('DD/MM/YYYY HH:mm:ss'),
  },
  {
    label: 'createdDate',
    key: 'createdDate',
    uniqueId: 'createdDate',
    filter: false,
    render: (value: any) =>
      !!value ? moment.utc(value).format('DD/MM/YYYY HH:mm:ss') : '',
    parseFilter: (value: any) => moment.utc(value).format('DD/MM/YYYY HH:mm:ss'),
  },
  {
    label: 'startDate',
    key: 'startDate',
    uniqueId: 'startDate',
    filter: false,
    render: (value: any) =>
      !!value ? moment.utc(value).format('DD/MM/YYYY HH:mm:ss') : '',
    parseFilter: (value: any) => moment.utc(value).format('DD/MM/YYYY HH:mm:ss'),
  },
];
