import React from 'react'
import Grid from 'components/uiKit/grid'
import { textTranslated } from 'components/TextTranslated'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import Toggle from 'components/uiKit/inputs/Toggle'
import EditorGroup from 'components/uiKit/inputs/Editor'
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
        <Grid gap="1.5rem" verticalAlgin="flex-start">

            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}>
                <InputGroup
                    id="group"
                    name="group"
                    label="group"
                    feedback={errors?.group}
                    status={errors?.group && 'error'}
                    value={selectedItem.group}
                    onChange={({ target }) => { updateField(target.name, target.value) }}
                    onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-group-help', returnDefault: 'nothing' }))}
                />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}>
                <InputGroup
                    id="key"
                    name="key"
                    label="key"
                    feedback={errors?.key}
                    status={errors?.key && 'error'}
                    value={selectedItem.key}
                    onChange={({ target }) => { updateField(target.name, target.value) }}
                    onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-key-help', returnDefault: 'nothing' }))}
                />
            </Grid>
            <Grid height="50px" responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}>
                <Toggle
                    id="richText"
                    name="richText"
                    label="rich-text"
                    value={selectedItem.isHtml}
                    onChange={({ target }) => updateField('isHtml', target.value)}
                />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}>
                <InputGroup
                    id="locale"
                    name="locale"
                    label="locale"
                    feedback={errors?.locale}
                    status={errors?.locale && 'error'}
                    value={selectedItem.locale}
                    onChange={({ target }) => { updateField(target.name, target.value) }}
                    onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-locale-help', returnDefault: 'nothing' }))}
                />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}>
                {
                    selectedItem.isHtml || selectedItem.isHTML
                        ? (
                            <EditorGroup
                                id="value"
                                name="value"
                                label="value"
                                feedback={errors?.value}
                                status={errors?.value && 'error'}
                                value={selectedItem.value}
                                onChange={({ target }) => { updateField(target.name, target.value) }}
                                onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-value-help', returnDefault: 'nothing' }))}
                            />
                        ) : (

                            <InputGroup
                                id="value"
                                name="value"
                                label="value"
                                feedback={errors?.value}
                                status={errors?.value && 'error'}
                                value={selectedItem.value}
                                onChange={({ target }) => { updateField(target.name, target.value) }}
                                onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-value-help', returnDefault: 'nothing' }))}
                            />
                        )
                }
            </Grid>
        </Grid>
    )
}
