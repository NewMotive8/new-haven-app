import Card from 'components/cards/card';
import DataGridV2 from 'components/uiKit/dataGridV2';
import Grid from 'components/uiKit/grid';
import Typography from 'components/uiKit/typography';
import { useWheel } from 'utils/customHooks/useWheel';

interface Props {
  onChange: (wheel: any) => void; // TODO: implement brand type properly when available,
}

export default function WheelSelector(props: Props) {
  const { onChange } = props;
  const { wheels } = useWheel();

  return (
    <Card
      color='secondary'
      padding={['p-3', 'pt-5']}
      style={{
        width: '600px',
        maxWidth: 'calc(100vw - 2rem)',
      }}
      animateOnScroll
      animation='zoom-in'
    >
      <Grid>
        <Typography
          translateGroup='selectors'
          translateKey='select-the-wheelRule'
          size='lg'
          weight={600}
          style={{
            width: '100%',
            textAlign: 'center',
          }}
        />
      </Grid>
      <DataGridV2
        data={wheels}
        columns={[
          {
            key: 'id',
            label: 'id',
            uniqueId: 'id',
            filter: true,
          },
          {
            key: 'internalName',
            label: 'internalName',
            uniqueId: 'internalName',
            filter: true,
          },
        ]}
        defaultPageSize={10}
        onRowClick={(row: any) => onChange(row)}
      />
    </Card>
  );
}
