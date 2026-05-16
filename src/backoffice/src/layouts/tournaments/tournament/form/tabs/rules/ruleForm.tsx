import Loading from 'assets/loading'
import Card from 'components/cards/card'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import Typography from 'components/uiKit/typography'
import React, { useState } from 'react'
import { BsXLg } from 'react-icons/bs'
import { IoSaveOutline } from 'react-icons/io5'
import { tournamentRaceI } from 'utils/services/api/requests/tournament-api/tournamentRace'
import ruleApi, { ruleI, RuleType } from 'utils/services/api/requests/tournament-api/rule'
import Select from 'components/uiKit/inputs/selectGroup'
interface Props {
    tournament: tournamentRaceI,
    close: Function,
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

const ruleTypeOptions = Object.values(RuleType).map(type => ({
    label: type,
    value: type,
}))

export default function RuleForm(props: Props) {
    const { tournament, close } = props
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState<ruleI>({
        id: undefined,
        tournament,
        type: RuleType.BET,
        fixedPoints: 0,
        multiplerPoints: 0,
        maximumPointsAllowed: 0,
        consecutiveCount: 0,
    })

    function updateField(field: keyof ruleI, value: any) {
        setForm((current) => ({ ...current, [field]: value }))
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
        // maximumPointsAllowed is optional, include if present
        if (allowedFields.includes('maximumPointsAllowed')) {
            payload.maximumPointsAllowed = formData.maximumPointsAllowed
        }
        return payload
    }

    async function handleSubmitRule() {
        setLoading(true)
        const payload = preparePayload(form)
        await ruleApi.submitRuleForm(payload, {
            successCallBack: () => {
                setLoading(false)
                close()
            },
            errorCallBack: () => setLoading(false),
        })
    }

    const fields = ruleTypeFields[form.type]


    // Find the selected option object for SelectGroup
    const selectedRuleType = ruleTypeOptions.find(opt => opt.value === form.type)

    return (
        <Card color='root' gap={'1rem'}>
            <Grid>
                <Typography
                    translateGroup="tr-rule-form"
                    translateKey="manage-rule"
                    weight={600}
                    size='lg'
                    algin='center'
                />
            </Grid>
            <Grid gap={'1rem'}>
                <Select
                    id="rule-type-select"
                    name="type"
                    label="Rule Type"
                    value={selectedRuleType}
                    options={ruleTypeOptions}
                    onChange={({ target }: any) => updateField('type', target.value)}
                />
                {fields.includes('fixedPoints') && (
                    <InputGroup
                        id="fixedPoints"
                        name="fixedPoints"
                        label="Fixed Points"
                        inputType='number'
                        value={form.fixedPoints}
                        onChange={e => updateField('fixedPoints', Number(e.target.value))}
                    />
                )}
                {fields.includes('multiplerPoints') && (
                    <InputGroup
                        id="multiplerPoints"
                        name="multiplerPoints"
                        label="Multiplier Points"
                        inputType='number'
                        value={form.multiplerPoints}
                        onChange={e => updateField('multiplerPoints', Number(e.target.value))}
                    />
                )}
                {fields.includes('maximumPointsAllowed') && (
                    <InputGroup
                        id="maximumPointsAllowed"
                        name="maximumPointsAllowed"
                        label="Maximum Points Allowed"
                        inputType='number'
                        value={form.maximumPointsAllowed}
                        onChange={e => updateField('maximumPointsAllowed', Number(e.target.value))}
                    />
                )}
                {fields.includes('consecutiveCount') && (
                    <InputGroup
                        id="consecutiveCount"
                        name="consecutiveCount"
                        label="Consecutive Count"
                        inputType='number'
                        value={form.consecutiveCount}
                        onChange={e => updateField('consecutiveCount', Number(e.target.value))}
                    />
                )}
            </Grid>
            <Grid wrap="nowrap" margin={['mt-5', 'mb-3']} horizontalAlgin="space-between">
                <Button disabled={loading} color="secondary" onClick={() => close()} id='cancel-rule-cta'>
                    Cancel
                </Button>
                <Button disabled={loading} color="primary" onClick={handleSubmitRule} id='save-rule-cta'>
                    Save Rule
                </Button>
            </Grid>
        </Card>
    )
}



