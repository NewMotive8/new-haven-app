import React from 'react'
import Grid from 'components/uiKit/grid'
import { textTranslated } from 'components/TextTranslated'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import Toggle from 'components/uiKit/inputs/Toggle'
import ImageUpload from 'components/uiKit/imageUpload'
import TierSelector from 'components/selectors/tier'
import { CrudContext } from '../..'
import { FormContext } from '..'
import ApplicationKey from './applicationKey'

export default function BasicTab() {
    const {
        selectedItem,
    } = React.useContext(CrudContext)
    const {
        errors,
        updateField,
        setCurrentInfo,
    } = React.useContext(FormContext)

    return (
        <Grid gap="1.5rem" padding={['pb-3']}>
            <Grid padding={['pb-2']}>
                <Toggle
                    id="enabled"
                    name="enabled"
                    label="enabled"
                    value={selectedItem.enabled}
                    onChange={({ target }) => { updateField(target.name, target.value) }}
                    displayInfo={!!(textTranslated({ group: 'forms-tabs-helpers', key: 'input-enabled-help', returnDefault: 'nothing' }))}
                    onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-enabled-help', returnDefault: 'nothing' }))}
                />
            </Grid>
            <Grid padding={['pb-2']}>
                <Toggle
                    id="returnAmountResponse"
                    name="returnAmountResponse"
                    label="returnAmountResponse"
                    value={selectedItem.returnAmountResponse ?? false}
                    onChange={({ target }) => {
                        updateField(target.name, target.value)
                    }}
                    displayInfo={!!(textTranslated({ group: 'forms-tabs-helpers', key: 'input-amount-response', returnDefault: 'nothing' }))}
                    onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-amount-response', returnDefault: 'nothing' }))}
                />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}>
                <InputGroup
                    id="operatorId"
                    name="operatorId"
                    label="operatorId"
                    feedback={errors?.operatorId}
                    status={errors?.operatorId && 'error'}
                    value={selectedItem.operatorId}
                    onChange={({ target }) => { updateField(target.name, target.value) }}
                    onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-operatorId-help', returnDefault: 'nothing' }))}
                />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}>
                <InputGroup
                    id="name"
                    name="name"
                    label="operator-name"
                    feedback={errors?.name}
                    status={errors?.name && 'error'}
                    value={selectedItem.name}
                    onChange={({ target }) => { updateField(target.name, target.value) }}
                    onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-name-help', returnDefault: 'nothing' }))}
                />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}>
                <InputGroup
                    id="secret"
                    name="secret"
                    label="operator-secret"
                    feedback={errors?.secret}
                    status={errors?.secret && 'error'}
                    value={selectedItem.secret}
                    inputType="password"
                    onChange={({ target }) => { updateField(target.name, target.value) }}
                    onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-secret-help', returnDefault: 'nothing' }))}
                />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}>
                <InputGroup
                    id="logo"
                    name="logo"
                    label="logo"
                    feedback={errors?.logo}
                    status={errors?.logo && 'error'}
                    value={selectedItem.logo}
                    onChange={({ target }) => { updateField(target.name, target.value) }}
                    onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-logo-help', returnDefault: 'nothing' }))}
                />
                <ImageUpload
                    hiddenInput
                    fileName={`logos/operator-${selectedItem.id}/logo`}
                    id="logo"
                    name="logo"
                    label="logo"
                    feedback={errors?.logo}
                    status={errors?.logo && 'error'}
                    value={selectedItem.logo}
                    onChange={({ target }) => { updateField(target.name, target.value) }}
                    onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-logo-help', returnDefault: 'nothing' }))}
                    inputProps={{
                        disabled: !selectedItem.id,
                    }}
                />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}>
                <TierSelector
                    id="tier"
                    name="tier"
                    label="tier"
                    feedback={errors?.tier}
                    status={errors?.tier && 'error'}
                    value={selectedItem.tier}
                    onChange={({ target }) => { updateField(target.name, target.value) }}
                    onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-tier-help', returnDefault: 'nothing' }))}
                />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}>
                <ApplicationKey operator={selectedItem} />
            </Grid>
        </Grid>
    )
}