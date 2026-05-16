import React from 'react'
import Grid from 'components/uiKit/grid'
import { textTranslated } from 'components/TextTranslated'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import Toggle from 'components/uiKit/inputs/Toggle'
import { CrudContext } from '../..'
import { FormContext } from '..'

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
        <Grid gap="0.5rem">
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
                <InputGroup
                    id="name"
                    name="name"
                    label="tiers-name"
                    feedback={errors?.name}
                    status={errors?.name && 'error'}
                    value={selectedItem.name}
                    onChange={({ target }) => { updateField(target.name, target.value) }}
                    onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-name-help', returnDefault: 'nothing' }))}
                />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}>
                <InputGroup
                    id="level"
                    name="level"
                    label="level"
                    inputType="number"
                    feedback={errors?.level}
                    status={errors?.level && 'error'}
                    value={selectedItem.level}
                    onChange={({ target }) => { updateField(target.name, target.value) }}
                    onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-level-help', returnDefault: 'nothing' }))}
                />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}>
                <InputGroup
                    id="maximumEvents"
                    name="maximumEvents"
                    label="maximumEvents"
                    inputType="number"
                    feedback={errors?.maximumEvents}
                    status={errors?.maximumEvents && 'error'}
                    value={selectedItem.maximumEvents}
                    onChange={({ target }) => { updateField(target.name, target.value) }}
                    onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-maximumEvents-help', returnDefault: 'nothing' }))}
                />
            </Grid>
            <Grid padding={['pb-4']}>
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
        </Grid>
    )
}
