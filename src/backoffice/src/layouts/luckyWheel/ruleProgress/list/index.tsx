import Button from 'components/uiKit/buttons';
import DataGridV2 from 'components/uiKit/dataGridV2';
import Grid from 'components/uiKit/grid';
import Typography from 'components/uiKit/typography';
import { useContext } from 'react';
import { BsPlusCircle } from 'react-icons/bs';
import { LWRuleProgressApi } from 'utils/services/api/requests/luckWheel/ruleProgress';
import { LWRuleProgressContext } from '..';
import { columns } from './listSettings';

export default function ListCrud() {
  const { setSelectedItem, listRuleProgress, deleteItem } = useContext(
    LWRuleProgressContext
  );
  return (
    <>
      <Grid horizontalAlgin='flex-end' margin='mb-3' hidden>
        <Button
          id='add-item-button'
          onClick={() => {
            setSelectedItem(LWRuleProgressApi.defaultRuleProgress);
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
              translateGroup='lw-rule-progress'
              translateKey='add'
              weight={600}
            />
          </Grid>
        </Button>
      </Grid>
      <DataGridV2
        columns={columns({ deleteItem })}
        pagination
        data={listRuleProgress}
      />
    </>
  );
}
