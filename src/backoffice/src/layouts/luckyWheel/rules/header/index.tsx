import Grid from 'components/uiKit/grid';
import Typography from 'components/uiKit/typography';
import { useContext } from 'react';
import { BsArrowLeftCircle } from 'react-icons/bs';
import { LWRulesContext } from '..';

export default function LWRulesHeader() {
  const { selectedItem, setSelectedItem } = useContext(LWRulesContext);
  return (
    <Grid>
      <Grid wrap='nowrap' gap='0.5rem' verticalAlgin='center'>
        {selectedItem && (
          <BsArrowLeftCircle
            size={25}
            onClick={() => setSelectedItem(null)}
            cursor='pointer'
          />
        )}
        <Grid wrap='nowrap' gap='0.5rem'>
          {selectedItem && (
            <Typography
              translateGroup='wheel-rules'
              translateKey={`${selectedItem.id} - `}
              weight={600}
              elementType='h5'
              margin='mb-1'
              style={{
                textTransform: 'capitalize',
              }}
            />
          )}
          <Typography
            translateGroup='wheel-rules'
            translateKey='wheel-rules'
            weight={600}
            elementType='h5'
            margin='mb-1'
            style={{
              textTransform: 'capitalize',
            }}
          />
        </Grid>
      </Grid>
      <Typography
        translateGroup='wheel-rules'
        translateKey='wheel-rules-administration'
        weight={400}
        elementType='p'
        margin='mb-3'
        style={{
          textTransform: 'capitalize',
        }}
      />
    </Grid>
  );
}
