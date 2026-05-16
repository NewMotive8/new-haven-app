import React, { useState } from 'react'
import Grid from 'components/uiKit/grid'
import { textTranslated } from 'components/TextTranslated'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import RangeInput from 'components/uiKit/inputs/inputGroup/variants/rangeInput'
import { JackpotI } from 'utils/services/api/requests/jackpots/types'
import Typography from 'components/uiKit/typography'
import { BsTools } from 'react-icons/bs'
import Button from 'components/uiKit/buttons'
import Card from 'components/cards/card'
import { useThemeWatcher } from 'utils/customHooks'
import TypeButton from 'components/uiKit/inputs/TypeButton'
import { FormContext } from '../../..'
import { CrudContext } from '../../../..'
import AdvancedTab from './advanced'

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
    const { widget } = selectedItem

    function updateWidget(field: string, value: any) {
        setSelectedItem((current: JackpotI) => ({
            ...current,
            widget: { ...current.widget, [field]: value },
        }))
    }

    return (
        <Grid gap="1rem">
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
                <TypeButton
                    name="optInType"
                    label="optInType"
                    onChange={({ target }) => updateField(target.name, target.value)}
                    value={selectedItem.optInType}
                    onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-widget-basic-optInType-help', returnDefault: 'nothing' }))}
                    options={[
                        {
                            label: (
                                <Typography
                                    translateGroup="input-widget-basic-optInType-setup"
                                    translateKey="auto-opt-in"
                                />
                            ),
                            value: 1,
                        },
                        {
                            label: (
                                <Typography
                                    translateGroup="input-widget-basic-optInType-setup"
                                    translateKey="user-opt-in"
                                />
                            ),
                            value: 2,
                        },
                    ]}
                />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
                <TypeButton
                    name="hasInformWins"
                    label="hasInformWins"
                    onChange={({ target }) => updateField(target.name, target.value)}
                    value={selectedItem.hasInformWins}
                    onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-widget-basic-hasInformWins-help', returnDefault: 'nothing' }))}
                    options={[
                        {
                            label: (
                                <Typography
                                    translateGroup="input-widget-basic-hasInformWins-setup"
                                    translateKey="no"
                                />
                            ),
                            value: false,
                        },
                        {
                            label: (
                                <Typography
                                    translateGroup="input-widget-basic-hasInformWins-setup"
                                    translateKey="yes"
                                />
                            ),
                            value: true,
                        },
                    ]}
                />
            </Grid>
            <Grid>
                <AdvancedTab />
            </Grid>

        </Grid>
    )
}
