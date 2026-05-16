import Button from 'components/uiKit/buttons';
import DataGridV2 from 'components/uiKit/dataGridV2';
import Grid from 'components/uiKit/grid';
import Typography from 'components/uiKit/typography';
import { useContext } from 'react';
import { BsPlusCircle } from 'react-icons/bs';
import { LWRuleInstanceApi } from 'utils/services/api/requests/luckWheel/ruleInstace';
import { LWRuleInstancesContext } from '..';
import { columns } from './listSettings';

export default function ListCrud() {
  const { setSelectedItem, listRuleInstance } = useContext(
    LWRuleInstancesContext
  );
  return (
    <>
      <Grid horizontalAlgin='flex-end' margin='mb-3'>
        <Button
          id='add-item-button'
          onClick={() => {
            setSelectedItem(LWRuleInstanceApi.defaultRuleInstace);
          }}
          color='primary'
        >
          <Grid
            wrap='nowrap'
            gap='0.25rem'
            horizontalAlgin='center'
            verticalAlgin='center'
          >
            <BsPlusCircle />
            <Typography
              translateGroup='lw-rule-instance'
              translateKey='add'
              weight={600}
            />
          </Grid>
        </Button>
      </Grid>
      <DataGridV2
        columns={columns}
        onRowClick={(row: any) => setSelectedItem(row)}
        pagination
        data={listRuleInstance}
      />
    </>
  );
}
