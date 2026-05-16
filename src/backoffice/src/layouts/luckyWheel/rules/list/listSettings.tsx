import { dataGridColumnType } from 'components/uiKit/dataGridV3';
import Grid from 'components/uiKit/grid';
import {
  BsCheck,
  BsFillCheckCircleFill,
  BsFillDashCircleFill,
  BsX,
} from 'react-icons/bs';

export const columns: Array<dataGridColumnType> = [
  {
    label: 'id',
    key: 'id',
    uniqueId: 'id',
    filter: true,
  },
  {
    label: 'type',
    key: 'type',
    uniqueId: 'type',
    filter: true,
  },
  {
    label: 'name',
    key: 'name',
    uniqueId: 'name',
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
];
