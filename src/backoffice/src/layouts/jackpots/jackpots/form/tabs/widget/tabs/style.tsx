import React, { useState } from 'react'
import Grid from 'components/uiKit/grid'
import { textTranslated } from 'components/TextTranslated'
import { JackpotI } from 'utils/services/api/requests/jackpots/types'
import Typography from 'components/uiKit/typography'
import TypeButton from 'components/uiKit/inputs/TypeButton'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import { FormContext } from '../../..'
import { CrudContext } from '../../../..'
import AdvancedTab from './advanced'
import WidgetPreview from './widgetPreview'

export default function StyleTab() {
    const {
        selectedItem,
        setSelectedItem,
    } = React.useContext(CrudContext)
    const {
        errors,
        updateField,
        setCurrentInfo,
    } = React.useContext(FormContext)
    const { widget } = selectedItem

    function updateWidget(field: string, value: any) {
        setSelectedItem((current: JackpotI) => ({
            ...current,
            widget: { ...current.widget, [field]: value },
        }))
    }

    return (
        <Grid>
            <Grid gap="0.5rem">
                <Grid gap="1.5rem" responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
                    <Grid>
                        <TypeButton
                            name="widgetDesign"
                            label="widgetDesign"
                            onChange={({ target }) => updateWidget(target.name, target.value)}
                            value={widget.widgetDesign}
                            onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-widget-widgetDesign-widgetDesign-help', returnDefault: 'nothing' }))}
                            options={[
                                {
                                    label: (
                                        <Typography
                                            translateGroup="input-widget-style-widgetDesign-setup"
                                            translateKey="Classic"
                                        />
                                    ),
                                    value: 1,
                                },
                                {
                                    label: (
                                        <Typography
                                            translateGroup="input-widget-style-widgetDesign-setup"
                                            translateKey="Minimal"
                                        />
                                    ),
                                    value: 3,
                                },
                                {
                                    label: (
                                        <Typography
                                            translateGroup="input-widget-style-widgetDesign-setup"
                                            translateKey="none-defined-in-code"
                                        />
                                    ),
                                    value: 0,
                                },
                            ]}
                        />
                    </Grid>
                    <WidgetPreview />
                </Grid>
                <Grid gap="1.5rem" hidden={!widget.widgetDesign} responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
                    <Grid>
                        <TypeButton
                            name="widgetMediaType"
                            label="widgetMediaType"
                            onChange={({ target }) => updateWidget(target.name, target.value)}
                            value={widget.widgetMediaType}
                            onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-widget-widgetMediaType-widgetMediaType-help', returnDefault: 'nothing' }))}
                            options={[
                                {
                                    label: (
                                        <Typography
                                            translateGroup="input-widget-style-widgetMediaType-setup"
                                            translateKey="image"
                                        />
                                    ),
                                    value: 'img',
                                },
                                {
                                    label: (
                                        <Typography
                                            translateGroup="input-widget-style-widgetMediaType-setup"
                                            translateKey="lottie"
                                        />
                                    ),
                                    value: 'lottie',
                                },
                            ]}
                        />
                    </Grid>
                    <Grid>
                        <InputGroup
                            id="widgetMediaUrl"
                            name="widgetMediaUrl"
                            label="widgetMediaUrl"
                            feedback={errors?.widgetMediaUrl}
                            status={errors?.widgetMediaUrl && 'error'}
                            value={widget.widgetMediaUrl}
                            onChange={({ target }) => { updateWidget(target.name, target.value) }}
                            onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-widgetMediaUrl-help', returnDefault: 'nothing' }))}
                        />
                    </Grid>
                    <Grid>
                        <InputGroup
                            id="widgetCustomCss"
                            name="widgetCustomCss"
                            label="widgetCustomCss"
                            feedback={errors?.widgetCustomCss}
                            status={errors?.widgetCustomCss && 'error'}
                            value={widget.widgetCustomCss}
                            onChange={({ target }) => { updateWidget(target.name, target.value) }}
                            onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-widgetCustomCss-help', returnDefault: 'nothing' }))}
                        />
                    </Grid>
                </Grid>
            </Grid>

        </Grid>
    )
}
