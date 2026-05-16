import Button from 'components/uiKit/buttons';
import { dataGridColumnType } from 'components/uiKit/dataGridV3';
import Grid from 'components/uiKit/grid';
import moment from 'moment';
import { BsCheck, BsTrash, BsX } from 'react-icons/bs';
interface Props {
  deleteItem: Function;
}
export const columns = ({ deleteItem }: Props): Array<dataGridColumnType> => {
  return [
    {
      label: 'id',
      key: 'id',
      uniqueId: 'id',
      filter: true,
    },
    {
      label: 'progress',
      key: 'progress',
      uniqueId: 'progress',
      filter: true,
    },
    {
      label: 'brandId',
      key: 'brandId',
      uniqueId: 'brandId',
      filter: true,
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
      label: 'updatedDate',
      key: 'updatedDate',
      uniqueId: 'updatedDate',
      filter: false,
      render: (value: any) =>
        !!value ? moment.utc(value).format('DD/MM/YYYY HH:mm:ss') : '',
      parseFilter: (value: any) => moment.utc(value).format('DD/MM/YYYY HH:mm:ss'),
    },
    {
      label: 'state',
      key: 'state',
      uniqueId: 'state',
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
      label: 'action',
      key: 'action',
      uniqueId: 'action',
      filter: false,
      render: (_: any, row: any) => (
        <Button
          id='crud-cancel-button'
          onClick={() => deleteItem(row?.id)}
          type='button'
          color='danger-outline'
        >
          <Grid
            wrap='nowrap'
            gap='0.25rem'
            horizontalAlgin='center'
            verticalAlgin='center'
          >
            <BsTrash />
          </Grid>
        </Button>
      ),
    },
  ];
};
