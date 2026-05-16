import React, { useEffect } from 'react'
import Grid from 'components/uiKit/grid'
import { textTranslated } from 'components/TextTranslated'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import { JackpotI } from 'utils/services/api/requests/jackpots/types'
import Toggle from 'components/uiKit/inputs/Toggle'
import TypeButton from 'components/uiKit/inputs/TypeButton'
import RangeInput from 'components/uiKit/inputs/inputGroup/variants/rangeInput'
import Typography from 'components/uiKit/typography'
import { FormContext } from '../..'
import { CrudContext } from '../../..'

interface thisCrudContext {
    selectedItem: JackpotI,
    setSelectedItem: Function,
}
export default function CommunityTab() {
    const {
        selectedItem,
        setSelectedItem,
    } = React.useContext(CrudContext) as thisCrudContext
    const {
        errors,
        setErrors,
        updateField,
        setCurrentInfo,
        validateTab,
    } = React.useContext(FormContext)

    function updateCommunity(field: string, value: any) {
        setSelectedItem((current: any) => ({
            ...current,
            community: { ...current.community, [field]: value },
        }))
        setErrors((err: any) => ({ ...err, [field]: '' }))
    }

    useEffect(() => {
        validateTab('community')
    }, [selectedItem?.hasCommunity, selectedItem?.community])

    return (
        <Grid gap="1.5rem">
            <Grid>
                <Toggle
                    label="jackpot-community-has-community"
                    name="hasCommunity"
                    id="hasCommunity"
                    value={!!selectedItem?.hasCommunity}
                    onChange={({ target }: any) => { updateField(target.name, !!target.value) }}
                    displayInfo={!!textTranslated({ group: 'forms-tabs-helpers', key: 'jackpot-community-input-jackpot-has-community-help', returnDefault: 'nothing' })}
                    onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'jackpot-community-input-jackpot-has-community-help', returnDefault: 'nothing' }))}
                />
            </Grid>
            <Grid padding={['pt-5']} hidden={!selectedItem?.hasCommunity} gap="1.5rem">
                <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}>
                    <RangeInput
                        max={100}
                        min={0}
                        step={0.1}
                        id="split"
                        name="split"
                        label="jackpot-community-split"
                        feedback={errors?.split}
                        status={errors?.split && 'error'}
                        value={selectedItem?.community?.split}
                        onChange={({ target }) => { updateCommunity(target.name, target.value) }}
                        onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'jackpot-community-input-split-help', returnDefault: 'nothing' }))}
                    />
                    <Grid>
                        <InputGroup
                            id="maximumWinAmount"
                            name="maximumWinAmount"
                            label="jackpot-community-maximumWinAmount"
                            feedback={errors?.maximumWinAmount}
                            status={errors?.maximumWinAmount && 'error'}
                            value={selectedItem?.community?.maximumWinAmount}
                            onChange={({ target }) => { updateCommunity(target.name, target.value) }}
                            onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'jackpot-community-input-maximumWinAmount-help', returnDefault: 'nothing' }))}
                        />
                    </Grid>
                    <Grid>
                        <InputGroup
                            id="maximumNumberOfPlayers"
                            name="maximumNumberOfPlayers"
                            label="jackpot-community-maximumNumberOfPlayers"
                            feedback={errors?.maximumNumberOfPlayers}
                            status={errors?.maximumNumberOfPlayers && 'error'}
                            value={selectedItem?.community?.maximumNumberOfPlayers}
                            onChange={({ target }) => { updateCommunity(target.name, target.value) }}
                            onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'jackpot-community-input-maximumNumberOfPlayers-help', returnDefault: 'nothing' }))}
                        />
                    </Grid>
                </Grid>
                <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}>
                    <TypeButton
                        name="payoutInterval"
                        value={selectedItem?.community?.payoutInterval}
                        label="jackpot-community-payoutInterval"
                        onChange={({ target }) => updateCommunity('payoutInterval', target.value)}
                        onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'jackpot-community-input-payoutInterval-help', returnDefault: 'nothing' }))}
                        options={[
                            {
                                value: 0,
                                label: (
                                    <Typography
                                        translateGroup="jackpot-community"
                                        translateKey="Currently logged in"
                                    />
                                ),
                            },
                            {
                                value: 9999,
                                label: (
                                    <Typography
                                        translateGroup="jackpot-community"
                                        translateKey="Has contributed at least once to this Jackpot"
                                    />
                                ),
                            },
                            {
                                value: 1,
                                customActiveCheck: (value: any) => !!value && value < 9999,
                                label: (
                                    <Typography
                                        translateGroup="jackpot-community"
                                        translateKey="Has contributed within this amount of time"
                                    />
                                ),
                            },
                        ]}
                        feedback={errors?.payoutInterval}
                        status={errors?.payoutInterval && 'error'}
                    />

                    <Grid padding={['pt-3']} hidden={!selectedItem?.community?.payoutInterval || (selectedItem?.community?.payoutInterval > 9998)}>
                        <RangeInput
                            min={1}
                            max={9998}
                            step={1}
                            id="payoutInterval"
                            name="payoutInterval"
                            label="payoutInterval"
                            feedback={errors?.payoutInterval}
                            status={errors?.payoutInterval && 'error'}
                            value={selectedItem?.community?.payoutInterval}
                            inputType="number"
                            onChange={({ target }) => { updateCommunity(target.name, target.value) }}
                            onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-payout-Interval-help', returnDefault: 'nothing' }))}
                        />
                    </Grid>
                </Grid>
            </Grid>

        </Grid>
    )
}
