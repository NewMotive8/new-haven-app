import React from 'react'
import Grid from 'components/uiKit/grid'
import { textTranslated } from 'components/TextTranslated'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import Toggle from 'components/uiKit/inputs/Toggle'
import { FormContext } from '..'
import { CrudContext } from '../..'

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
                    label="product-name"
                    feedback={errors?.name}
                    status={errors?.name && 'error'}
                    value={selectedItem.name}
                    onChange={({ target }) => { updateField(target.name, target.value) }}
                    onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-name-help', returnDefault: 'nothing' }))}
                />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}>
                <InputGroup
                    id="location"
                    name="location"
                    label="location"
                    feedback={errors?.location}
                    status={errors?.location && 'error'}
                    value={selectedItem.location}
                    onChange={({ target }) => { updateField(target.name, target.value) }}
                    onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-location-help', returnDefault: 'nothing' }))}
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
