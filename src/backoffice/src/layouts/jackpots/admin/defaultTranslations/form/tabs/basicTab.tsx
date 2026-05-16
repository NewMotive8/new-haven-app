import React, { useEffect } from 'react'
import Grid from 'components/uiKit/grid'
import { textTranslated } from 'components/TextTranslated'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import EditorGroup from 'components/uiKit/inputs/Editor'
import Toggle from 'components/uiKit/inputs/Toggle'
import { CrudContext } from '../..'
import { FormContext } from '..'

export default function BasicTab() {
    const {
        selectedItem,
        setSelectedItem,
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
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}>
                <Grid horizontalAlgin="flex-end" padding={['pb-3']}>
                    <Toggle
                        value={selectedItem.isHtml}
                        onChange={({ target }) => updateField('isHtml', target.value)}
                        id="isHtml"
                        name="isHtml"
                        label="rich-text"
                        onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-rich-text-help', returnDefault: 'nothing' }))}
                        displayInfo={!!(textTranslated({ group: 'forms-tabs-helpers', key: 'input-rich-text-help', returnDefault: 'nothing' }))}
                    />
                </Grid>
                {
                    selectedItem.isHtml
                        ? (
                            <EditorGroup
                                id="translation"
                                name="translation"
                                label="translation"
                                feedback={errors?.translation}
                                status={errors?.translation && 'error'}
                                value={selectedItem.translation}
                                onChange={({ target }) => { updateField(target.name, target.value) }}
                                onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-translation-help', returnDefault: 'nothing' }))}
                            />
                        )
                        : (
                            <InputGroup
                                id="translation"
                                name="translation"
                                label="translation"
                                feedback={errors?.translation}
                                status={errors?.translation && 'error'}
                                value={selectedItem.translation}
                                onChange={({ target }) => { updateField(target.name, target.value) }}
                                onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-translation-help', returnDefault: 'nothing' }))}
                            />
                        )
                }
            </Grid>
        </Grid>
    )
}
