import Loading from 'assets/loading'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import Typography from 'components/uiKit/typography'
import React, { useState } from 'react'
import { IoSaveOutline } from 'react-icons/io5'
import ruleApi, { ruleI, RuleType } from 'utils/services/api/requests/tournament-api/rule'

interface Props {
    item: ruleI,
    successCallback: Function,
}

const ruleTypeFields: Record<RuleType, Array<keyof ruleI>> = {
    [RuleType.BET]: ['fixedPoints'],
    [RuleType.BET_AMOUNT]: ['multiplerPoints', 'maximumPointsAllowed'],
    [RuleType.WIN]: ['fixedPoints'],
    [RuleType.WIN_AMOUNT]: ['multiplerPoints', 'maximumPointsAllowed'],
    [RuleType.WIN_MULTIPLIER]: ['multiplerPoints', 'maximumPointsAllowed'],
    [RuleType.LOSSES_IN_A_ROW]: ['fixedPoints', 'consecutiveCount'],
    [RuleType.WINS_IN_A_ROW]: ['fixedPoints', 'consecutiveCount'],
}

export default function EditAmountCell(props: Props) {
    const { item, successCallback } = props
    const [loading, setLoading] = useState(false)
    const [rule, setRule] = useState(item)

    function updateField(field: keyof ruleI, value: any) {
        setRule((current) => ({ ...current, [field]: value }))
    }

    function preparePayload(formData: ruleI): Partial<ruleI> {
        const allowedFields = ruleTypeFields[formData.type]
        const payload: any = {
            type: formData.type,
            tournament: formData.tournament,
            id: formData.id,
        }
        allowedFields.forEach(field => {
            payload[field] = formData[field]
        })
        if (allowedFields.includes('maximumPointsAllowed')) {
            payload.maximumPointsAllowed = formData.maximumPointsAllowed
        }
        return payload
    }

    async function handleSubmitRule() {
        setLoading(true)
        const payload = preparePayload(rule)
        await ruleApi.submitRuleForm(payload, {
            successCallBack: () => {
                setLoading(false)
                successCallback()
            },
            errorCallBack: () => setLoading(false),
        })
    }

    const fields = ruleTypeFields[rule.type]

    return (
        <Grid gap='0.5rem' wrap='nowrap' verticalAlgin='flex-end' width={'fit-content'}>
            {fields.includes('fixedPoints') && (
                <InputGroup
                    id="fixedPoints"
                    name="fixedPoints"
                    label="Fixed Points"
                    inputType='number'
                    value={rule.fixedPoints}
                    onChange={({ target }) => updateField('fixedPoints', Number(target.value))}
                    styles={{ maxWidth: '180px' }}
                />
            )}
            {fields.includes('multiplerPoints') && (
                <InputGroup
                    id="multiplerPoints"
                    name="multiplerPoints"
                    label="Multiplier Points"
                    inputType='number'
                    value={rule.multiplerPoints}
                    onChange={({ target }) => updateField('multiplerPoints', Number(target.value))}
                    styles={{ maxWidth: '180px' }}
                />
            )}
            {fields.includes('maximumPointsAllowed') && (
                <InputGroup
                    id="maximumPointsAllowed"
                    name="maximumPointsAllowed"
                    label="Maximum Points Allowed"
                    inputType='number'
                    value={rule.maximumPointsAllowed}
                    onChange={({ target }) => updateField('maximumPointsAllowed', Number(target.value))}
                    styles={{ maxWidth: '180px' }}
                />
            )}
            {fields.includes('consecutiveCount') && (
                <InputGroup
                    id="consecutiveCount"
                    name="consecutiveCount"
                    label="Consecutive Count"
                    inputType='number'
                    value={rule.consecutiveCount}
                    onChange={({ target }) => updateField('consecutiveCount', Number(target.value))}
                    styles={{ maxWidth: '180px' }}
                />
            )}
            <Button
                id='crud-button-submit'
                disabled={loading}
                color="primary"
                onClick={handleSubmitRule}
            >
                <Grid wrap="nowrap" gap="0.25rem" horizontalAlgin="center" verticalAlgin="center">
                    <IoSaveOutline />
                    <Typography
                        translateGroup="global"
                        translateKey="save"
                    />
                    {loading && <Loading size={30} />}
                </Grid>
            </Button>
        </Grid>
    )
}