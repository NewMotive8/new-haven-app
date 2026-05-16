import React from 'react'
import Grid from 'components/uiKit/grid'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import Toggle from 'components/uiKit/inputs/Toggle'
import { CrudContext } from '../..'
import { FormContext } from '..'
import Typography from 'components/uiKit/typography'
import GenericSelector from 'components/selectors/generic'
import raffleApi from 'utils/services/api/requests/raffle-api/raffle'

export default function BasicTab() {
  const { selectedItem, raffleId } = React.useContext(CrudContext)
  const { errors, updateField } = React.useContext(FormContext)

  return (
    <Grid gap="1rem" verticalAlgin="flex-start">
      <Grid>
        <InputGroup
          id="name"
          name="name"
          label="raffle-instance-name"
          feedback={<Typography {...errors?.name} />}
          status={errors?.name && 'error'}
          value={selectedItem?.name}
          onChange={({ target }) => {
            updateField(target.name, target.value)
          }}
        />
      </Grid>

      <Grid hidden={!!raffleId}>
        <GenericSelector
          columns={['id', 'name']}
          onSelect={(value) => updateField('raffleId', value.id)}
          label="raffle-id"
          mainlyKey="name"
          dataService={(p) => raffleApi.getItems(p)}
          dataServiceId="raffle"
          value={selectedItem.raffleId}
        />
      </Grid>

      <Grid>
        <InputGroup
          id="entryOpenAtUtc"
          name="entryOpenAtUtc"
          label="entryOpenAtUtc"
          inputType="datetime-local"
          feedback={<Typography {...errors?.entryOpenAtUtc} />}
          status={errors?.entryOpenAtUtc && 'error'}
          value={selectedItem?.entryOpenAtUtc}
          onChange={({ target }) => {
            updateField(target.name, target.value)
          }}
        />
      </Grid>

      <Grid>
        <InputGroup
          id="drawAtUtc"
          name="drawAtUtc"
          label="drawAtUtc"
          inputType="datetime-local"
          feedback={<Typography {...errors?.drawAtUtc} />}
          status={errors?.drawAtUtc && 'error'}
          value={selectedItem?.drawAtUtc}
          onChange={({ target }) => {
            updateField(target.name, target.value)
          }}
        />
        <Typography size="xsm">Draw time is interpreted as UTC.</Typography>
      </Grid>

      <Grid>
        <InputGroup
          id="maxEntriesPerPlayer"
          name="maxEntriesPerPlayer"
          label="maxEntriesPerPlayer"
          inputType="number"
          feedback={<Typography {...errors?.maxEntriesPerPlayer} />}
          status={errors?.maxEntriesPerPlayer && 'error'}
          value={selectedItem?.maxEntriesPerPlayer ?? ''}
          onChange={({ target }) => {
            updateField(target.name, target.value === '' ? null : Number(target.value))
          }}
        />
        <Typography size="xsm">Leave empty for unlimited entries per player.</Typography>
      </Grid>

      <Grid>
        <Toggle
          onChange={({ target }: any) => {
            updateField(target.name, Boolean(target.value))
          }}
          value={Boolean(selectedItem?.allowMultipleEntriesPerTicket)}
          id="allowMultipleEntriesPerTicket"
          name="allowMultipleEntriesPerTicket"
          label="allowMultipleEntriesPerTicket"
        />
        <Typography size="xsm">
          OFF: each entry is a unique ticket. ON: tickets can carry entry quantity.
        </Typography>
      </Grid>
    </Grid>
  )
}
