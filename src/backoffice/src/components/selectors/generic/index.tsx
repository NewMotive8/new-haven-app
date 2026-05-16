import React, { useContext } from 'react'
import { useQuery } from 'react-query'
import Card from 'components/cards/card'
import DataGridV3, { dataGridColumnType } from 'components/uiKit/dataGridV3'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import DialogContext from 'context/dialog'
import { pageableProps } from 'utils/services/api/types'

interface Props {
  dataService: (props: pageableProps) => Promise<any>;
  dataServiceId: string;
  value: number | string | Record<string, any>;
  mainlyKey: string;
  onSelect: (value: any) => void;
  columns: string[];
  label: string | React.ReactNode;
}

function Label({ label, value, mainlyKey }:Props) {
  return (
    <Grid gap="0.5rem">
      {typeof label === 'string' ? (
        <Typography translateGroup="generic-selector-label" translateKey={label} size="xsm" />
      ) : (
        label
      )}
      <Grid>
        <Typography>{value ? (value as any)[mainlyKey as any] : 'Select a jackpot race'}</Typography>
      </Grid>
    </Grid>
  );
}

interface DialogProps extends Props {
  closeDialog: () => void;
}

function GenericSelectorDialog(props:DialogProps) {
  const { dataService, dataServiceId, value: initialValue, onSelect, closeDialog, columns } = props;
  const [selectedValue, setSelectedValue] = React.useState(initialValue);

  const gridColumns: Array<dataGridColumnType> = columns.map((item, i) => ({
    key: item,
    uniqueId: `${item}-${i}`,
    label: item,
    filter: true,
  }));

  return (
    <Card style={{ width: '600px', maxWidth: 'calc(100vw - 2rem)' }} color="root">
      <Grid gap="1rem">
        <Grid>
          <Label {...props} value={selectedValue} />
        </Grid>
        <Grid>
          <DataGridV3
            columns={gridColumns}
            dataGridId={dataServiceId}
            dataService={dataService}
            enablePagination
            defaultPageSize={15}
            onRowClick={(item: any) => {
              setSelectedValue(item);
              onSelect(item);
              closeDialog();
            } } />
        </Grid>
      </Grid>
    </Card>
  );
}

function GenericSelector(props: Props) {
  const { value: vp, dataService, dataServiceId } = props;
  const { displayDialog, removeDialog } = useContext(DialogContext);

  const { data: fetchedData, refetch } = useQuery(
    [`generic-selector-${dataServiceId}`, vp],
    () => dataService({ filterExp: `id$like=${vp}` }),
    {
      enabled: typeof vp !== 'object',
    }
  );

  const computedValue = typeof vp === 'object' ? vp : fetchedData?.content?.[0] ?? vp;

  const handleDisplayDialog = () => {
    displayDialog({
      dialogId: 'GENERIC-DIALOG-SELECTOR',
      content: (
        <GenericSelectorDialog
          {...props}
          closeDialog={() => removeDialog('GENERIC-DIALOG-SELECTOR')} />
      ),
      onCloseCallback: () => {
        if (typeof vp !== 'object') {
          refetch();
        }
      },
    });
  };

  return (
    <Card onClick={handleDisplayDialog} color="primary-full" style={{ padding: '0.25rem 0.5rem' }}>
      <Grid>
        <Label {...props} value={computedValue} />
      </Grid>
    </Card>
  );
}

export default GenericSelector;
