import Grid from 'components/uiKit/grid'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import SelectGroup from 'components/uiKit/inputs/selectGroup'
import Typography from 'components/uiKit/typography'
import React from 'react'
import { FormContext } from '../..'
import { CrudContext } from '../../..'

const ruleTypeOptions = [
    { value: 'TURNOVER', label: 'Turnover (X tickets per Y turnover)' },
    { value: 'BET_COUNT', label: 'Bet Count (X tickets per Y bets)' },
    { value: 'EVENT_AMOUNT', label: 'Event Amount (X tickets per Y event amount)' },
    { value: 'PURCHASE', label: 'Purchase (Purchase event grants tickets)' },
]

function renderSummary(ruleType?: string) {
    const map: Record<string, string> = {
        TURNOVER: 'Tickets are awarded by turnover amount.',
        BET_COUNT: 'Tickets are awarded by number of bets.',
        EVENT_AMOUNT: 'Tickets are awarded by a specific event amount.',
        PURCHASE: 'Tickets are awarded directly from purchase events.',
    }
    return map[ruleType || ''] || 'No ticket mechanics configured yet.'
}

export default function TicketMechanicsTab() {
    const { selectedItem } = React.useContext(CrudContext)
    const { errors, updateField } = React.useContext(FormContext)

    const selectedRuleType = selectedItem?.ruleType || ''
    const showUnitAmount = selectedRuleType === 'TURNOVER' || selectedRuleType === 'EVENT_AMOUNT'
    const showUnitCount = selectedRuleType === 'BET_COUNT'

    return (
        <Grid gap="1rem" padding={['pt-4']}>
            <Grid>
                <Typography weight={700} size="md">Ticket Mechanics</Typography>
                <Typography size="sm">{renderSummary(selectedRuleType)}</Typography>
            </Grid>

            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)' }}>
                <SelectGroup
                    id="ruleType"
                    name="ruleType"
                    label="Ticket rule type"
                    options={ruleTypeOptions}
                    value={ruleTypeOptions.find((option) => option.value === selectedRuleType) || null}
                    feedback={errors?.ruleType}
                    status={errors?.ruleType && 'error'}
                    onChange={({ target }) => {
                        const nextType = target.value
                        updateField('ruleType', nextType)
                        if (nextType !== 'BET_COUNT') {
                            updateField('unitCount', null)
                        }
                        if (nextType !== 'TURNOVER' && nextType !== 'EVENT_AMOUNT') {
                            updateField('unitAmount', null)
                        }
                    }}
                />
            </Grid>

            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)' }}>
                <InputGroup
                    id="ticketsPerUnit"
                    name="ticketsPerUnit"
                    label="Tickets per unit (X)"
                    inputType="number"
                    inputProps={{ min: 1, step: 1 }}
                    value={selectedItem?.ticketsPerUnit ?? ''}
                    feedback={errors?.ticketsPerUnit}
                    status={errors?.ticketsPerUnit && 'error'}
                    onChange={({ target }) => {
                        updateField(target.name, target.value === '' ? null : Number(target.value))
                    }}
                />
            </Grid>

            <Grid hidden={!showUnitAmount} responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)' }}>
                <InputGroup
                    id="unitAmount"
                    name="unitAmount"
                    label="Unit amount (Y)"
                    inputType="number"
                    inputProps={{ min: 0.01, step: 0.01 }}
                    value={selectedItem?.unitAmount ?? ''}
                    feedback={errors?.unitAmount}
                    status={errors?.unitAmount && 'error'}
                    onChange={({ target }) => {
                        updateField(target.name, target.value === '' ? null : Number(target.value))
                    }}
                />
            </Grid>

            <Grid hidden={!showUnitCount} responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)' }}>
                <InputGroup
                    id="unitCount"
                    name="unitCount"
                    label="Unit count (Y)"
                    inputType="number"
                    inputProps={{ min: 1, step: 1 }}
                    value={selectedItem?.unitCount ?? ''}
                    feedback={errors?.unitCount}
                    status={errors?.unitCount && 'error'}
                    onChange={({ target }) => {
                        updateField(target.name, target.value === '' ? null : Number(target.value))
                    }}
                />
            </Grid>

            <Grid
                style={{ border: '1px solid var(--card-border)', borderRadius: '4pt' }}
                padding={['p-3']}
                gap="0.25rem"
            >
                <Typography weight={700} size="sm">Current Configuration Summary</Typography>
                <Typography size="sm">Rule type: {selectedRuleType || '-'}</Typography>
                <Typography size="sm">Tickets per unit: {selectedItem?.ticketsPerUnit ?? '-'}</Typography>
                <Typography size="sm">Unit amount: {showUnitAmount ? (selectedItem?.unitAmount ?? '-') : 'N/A'}</Typography>
                <Typography size="sm">Unit count: {showUnitCount ? (selectedItem?.unitCount ?? '-') : 'N/A'}</Typography>
            </Grid>
        </Grid>
    )
}
