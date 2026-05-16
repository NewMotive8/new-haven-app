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
                    label="currency-name"
                    feedback={errors?.name}
                    status={errors?.name && 'error'}
                    value={selectedItem.name}
                    onChange={({ target }) => { updateField(target.name, target.value) }}
                    onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-name-help', returnDefault: 'nothing' }))}
                />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
                <InputGroup
                    id="iso3"
                    name="iso3"
                    label="iso3"
                    feedback={errors?.iso3}
                    status={errors?.iso3 && 'error'}
                    value={selectedItem.iso3}
                    onChange={({ target }) => { updateField(target.name, target.value) }}
                    onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-iso3-help', returnDefault: 'nothing' }))}
                />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
                <Toggle
                    label="enabled"
                    name="enabled"
                    id="enabled"
                    value={selectedItem.enabled}
                    onChange={({ target }: any) => { updateField(target.name, target.value) }}
                    displayInfo={!!textTranslated({ group: 'forms-tabs-helpers', key: 'input-currency-enabled-help', returnDefault: 'nothing' })}
                    onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-currency-enabled-help', returnDefault: 'nothing' }))}
                />
            </Grid>
        </Grid>
    )
}
