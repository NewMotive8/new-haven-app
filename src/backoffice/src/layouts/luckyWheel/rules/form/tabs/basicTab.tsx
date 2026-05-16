import BrandSelector from 'components/selectors/brand';
import { textTranslated } from 'components/TextTranslated';
import Grid from 'components/uiKit/grid';
import InputGroup from 'components/uiKit/inputs/inputGroup';
import Toggle from 'components/uiKit/inputs/Toggle';
import Typography from 'components/uiKit/typography';
import DialogContext from 'context/dialog';
import React, { useEffect, useState } from 'react';
import { useBrand } from 'utils/customHooks/useBrand';
import { brandI } from 'utils/services/api/requests/brand';
import { FormContext } from '..';
import { LWRulesContext } from '../..';

export default function BasicTab() {
  const { selectedItem } = React.useContext(LWRulesContext);
  const { errors, updateField, setCurrentInfo } = React.useContext(FormContext);
  const { displayDialog, removeDialog } = React.useContext(DialogContext);
  const [bandSelect, setBandSelect] = useState<brandI | null>(null);
  const { brands, findBrand } = useBrand();
  useEffect(() => {
    setBandSelect(findBrand(selectedItem?.brandId));
  }, [selectedItem, brands]);

  function handleChooseBrand() {
    displayDialog({
      dialogId: 'BRAND-SELECTOR',
      content: (
        <BrandSelector
          onChange={(brand: any) => {
            setBandSelect(brand);
            updateField('brandId', brand.id);
            removeDialog('BRAND-SELECTOR');
          }}
        />
      ),
      dialogProps: {
        disableOverlayClose: false,
        displayClose: false,
      },
    });
  }
  return (
    <Grid gap='0.5rem' verticalAlgin='flex-start'>
      <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
        <InputGroup
          id='name'
          name='name'
          label='name'
          feedback={errors?.name}
          status={errors?.name && 'error'}
          value={selectedItem.name}
          onChange={({ target }) => {
            updateField(target.name, target.value);
          }}
          onFocus={() =>
            setCurrentInfo(
              textTranslated({
                group: 'forms-tabs-helpers',
                key: 'input-name-help',
                returnDefault: 'nothing',
              })
            )
          }
        />
      </Grid>
      <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
        <InputGroup
          id='type'
          name='type'
          label='type'
          feedback={errors?.type}
          status={errors?.type && 'error'}
          value={selectedItem.type}
          onChange={({ target }) => {
            updateField(target.name, target.value);
          }}
          onFocus={() =>
            setCurrentInfo(
              textTranslated({
                group: 'forms-tabs-helpers',
                key: 'input-value-help',
                returnDefault: 'nothing',
              })
            )
          }
        />
      </Grid>
      <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
        <Toggle
          label='enabled'
          name='enabled'
          id='enabled'
          value={selectedItem.enabled}
          onChange={({ target }) => {
            updateField(target.name, target.value);
          }}
        />
      </Grid>
      <Grid
        responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}
        wrap='wrap'
        gap={'0.5rem'}
      >
        <Grid>
          <Typography
            translateGroup='input-group-label'
            translateKey={'brandId'}
            size='sm'
            weight={600}
            style={{
              transform: 'scale(1.25) translateY(0%) translateX(10.3%)',
            }}
          />
        </Grid>

        <Grid
          onClick={() => handleChooseBrand()}
          style={{
            background: 'var(--input-bg)',
            borderRadius: '0.5rem',
            padding: '0.25rem 0.5rem',
            cursor: 'pointer',
          }}
          type='button'
        >
          <Grid gap='0.5rem' verticalAlgin='center'>
            <img
              src={bandSelect?.logo}
              alt='brand-logo'
              width='30px'
              height='30px'
              style={{ borderRadius: '50%', overflow: 'hidden' }}
            />
            {bandSelect?.name ? (
              <Typography>{bandSelect?.name}</Typography>
            ) : (
              <Typography
                translateGroup='input-text-brandID'
                translateKey={'select-brandID'}
              />
            )}
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
