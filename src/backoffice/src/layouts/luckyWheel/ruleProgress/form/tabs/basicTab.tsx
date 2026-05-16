import BrandSelector from 'components/selectors/brand';
import PlayersSelector from 'components/selectors/players';
import WheelInstanceSelector from 'components/selectors/wheelInstance';
import { textTranslated } from 'components/TextTranslated';
import Grid from 'components/uiKit/grid';
import InputGroup from 'components/uiKit/inputs/inputGroup';
import SelectGroup from 'components/uiKit/inputs/selectGroup';
import Typography from 'components/uiKit/typography';
import DialogContext from 'context/dialog';
import React, { useEffect, useState } from 'react';
import { useBrand } from 'utils/customHooks/useBrand';
import { brandI } from 'utils/services/api/requests/brand';
import { FormContext } from '..';
import { LWRuleProgressContext } from '../..';

export default function BasicTab() {
  const { selectedItem } = React.useContext(LWRuleProgressContext);
  const { errors, updateField, setCurrentInfo } = React.useContext(FormContext);
  const [bandSelect, setBandSelect] = useState<brandI | null>(null);
  const { displayDialog, removeDialog } = React.useContext(DialogContext);
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
  function handleChooseWheelInstance() {
    displayDialog({
      dialogId: 'WHEEL-INSTANCE-SELECTOR',
      content: (
        <WheelInstanceSelector
          onChange={(brand: any) => {
            updateField('wheelRuleInstance', brand);
            removeDialog('WHEEL-INSTANCE-SELECTOR');
          }}
        />
      ),
      dialogProps: {
        disableOverlayClose: false,
        displayClose: false,
      },
    });
  }
  function handleChoosePlayer() {
    displayDialog({
      dialogId: 'PLAYER-SELECTOR',
      content: (
        <PlayersSelector
          onChange={(brand: any) => {
            updateField('player', brand);
            removeDialog('PLAYER-SELECTOR');
          }}
        />
      ),
      dialogProps: {
        disableOverlayClose: false,
        displayClose: false,
      },
    });
  }
  const stateOptions = [
    { label: 'ACTIVE', value: 'ACTIVE' },
    { label: 'EXPIRED', value: 'EXPIRED' },
    { label: 'CANCELLED', value: 'CANCELLED' },
  ];
  return (
    <Grid gap='0.5rem' verticalAlgin='flex-start'>
      <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
        <InputGroup
          id='progress'
          name='progress'
          label='progress'
          feedback={errors?.progress}
          status={errors?.progress && 'error'}
          value={selectedItem.progress}
          onChange={({ target }) => {
            updateField(target.name, target.value);
          }}
          onFocus={() =>
            setCurrentInfo(
              textTranslated({
                group: 'forms-tabs-helpers',
                key: 'input-progress-help',
                returnDefault: 'nothing',
              })
            )
          }
        />
      </Grid>
      <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
        <SelectGroup
          value={stateOptions?.find(
            (bl: any) => bl.value === selectedItem.state
          )}
          id='state'
          name='state'
          label='state'
          options={stateOptions}
          onChange={(e: any) => updateField('state', e.value)}
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

      <Grid
        responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}
        wrap='wrap'
        gap={'0.5rem'}
      >
        <Grid>
          <Typography
            translateGroup='input-group-label'
            translateKey={'wheelRuleInstance'}
            size='sm'
            weight={600}
            style={{
              transform: 'scale(1.25) translateY(0%) translateX(10.3%)',
            }}
          />
        </Grid>

        <Grid
          onClick={() => handleChooseWheelInstance()}
          style={{
            background: 'var(--input-bg)',
            borderRadius: '0.5rem',
            padding: '0.5rem',
            cursor: 'pointer',
          }}
          type='button'
        >
          <Grid gap='0.5rem' verticalAlgin='center'>
            {selectedItem?.wheelRuleInstance?.id ? (
              <Typography>{selectedItem.wheelRuleInstance.name}</Typography>
            ) : (
              <Typography
                translateGroup='input-text-wheelRuleInstance'
                translateKey={'select-wheelRuleInstance'}
              />
            )}
          </Grid>
        </Grid>
      </Grid>

      <Grid
        responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}
        wrap='wrap'
        gap={'0.5rem'}
      >
        <Grid>
          <Typography
            translateGroup='input-group-label'
            translateKey={'player'}
            size='sm'
            weight={600}
            style={{
              transform: 'scale(1.25) translateY(0%) translateX(10.3%)',
            }}
          />
        </Grid>

        <Grid
          onClick={() => handleChoosePlayer()}
          style={{
            background: 'var(--input-bg)',
            borderRadius: '0.5rem',
            padding: '0.5rem',
            cursor: 'pointer',
          }}
          type='button'
        >
          <Grid gap='0.5rem' verticalAlgin='center'>
            {selectedItem?.player?.id ? (
              <Typography>{selectedItem.player.brandPlayerId}</Typography>
            ) : (
              <Typography
                translateGroup='input-text-wheelRuleInstance'
                translateKey={'select-wheelRuleInstance'}
              />
            )}
          </Grid>
        </Grid>
      </Grid>

      <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
        <InputGroup
          id='createdDate'
          name='createdDate'
          label='createdDate'
          inputType='date'
          readOnly
          feedback={errors?.createdDate}
          status={errors?.createdDate && 'error'}
          value={selectedItem.createdDate?.substring(0, 10) || ''}
          onChange={({ target }) => {
            updateField(target.name, target.value);
          }}
          onFocus={() =>
            setCurrentInfo(
              textTranslated({
                group: 'forms-tabs-helpers',
                key: 'input-createdDate-property-help',
                returnDefault: 'nothing',
              })
            )
          }
        />
      </Grid>
      <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
        <InputGroup
          id='updatedDate'
          name='updatedDate'
          label='updatedDate'
          inputType='date'
          readOnly
          feedback={errors?.updatedDate}
          status={errors?.updatedDate && 'error'}
          value={selectedItem.updatedDate?.substring(0, 10) || ''}
          onChange={({ target }) => {
            updateField(target.name, target.value);
          }}
          onFocus={() =>
            setCurrentInfo(
              textTranslated({
                group: 'forms-tabs-helpers',
                key: 'input-property-updatedDate-help',
                returnDefault: 'nothing',
              })
            )
          }
        />
      </Grid>
    </Grid>
  );
}
