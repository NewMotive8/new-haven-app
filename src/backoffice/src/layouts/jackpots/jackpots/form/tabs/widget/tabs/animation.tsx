import React, { useEffect, useState } from 'react'
import Grid from 'components/uiKit/grid'
import { textTranslated } from 'components/TextTranslated'
import { JackpotI, Widget } from 'utils/services/api/requests/jackpots/types'
import Typography from 'components/uiKit/typography'
import TypeButton from 'components/uiKit/inputs/TypeButton'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import SelectGroup from 'components/uiKit/inputs/selectGroup'
import Button from 'components/uiKit/buttons'
import { FormContext } from '../../..'
import { CrudContext } from '../../../..'
import AdvancedTab from './advanced'
import { lottieExamples } from './animationFiles'

export default function AnimationTab() {
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
    const { jooba } = window

    function updateWidget(field: keyof Widget, value: any) {
        setSelectedItem((current: JackpotI) => ({
            ...current,
            widget: { ...current.widget, [field]: value },
        }))
    }

    useEffect(() => {
        // TODO: Update CDN domain
        updateWidget('customAnimationCss', `${process.env.NEXT_PUBLIC_CDN_URL || 'https://backoffice.hintx.org/cdn'}/styles/win-animation-default.css`)
    }, [])

    function tryAnimation() {
        jooba.actions.displayWinner({
            cssUrl: widget.customAnimationCss,
            lottieUrl: widget.customAnimationLottie,
        })
    }

    return (
        <Grid>
            <Grid gap="0.5rem" verticalAlgin="flex-start">
                <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
                    <InputGroup
                        id="customAnimationCss"
                        name="customAnimationCss"
                        label="customAnimationCss"
                        feedback={errors?.customAnimationCss}
                        status={errors?.customAnimationCss && 'error'}
                        value={widget.customAnimationCss}
                        onChange={({ target }) => { updateWidget('customAnimationCss', target.value) }}
                        onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-customAnimationCss-help', returnDefault: 'nothing' }))}
                    />
                </Grid>
                <Grid gap="1.5rem" responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
                    <SelectGroup
                        options={lottieExamples}
                        id="customAnimationLottie"
                        name="customAnimationLottie"
                        label="customAnimationLottieExamples"
                        feedback={errors?.customAnimationLottie}
                        status={errors?.customAnimationLottie && 'error'}
                        value={lottieExamples.find((item: any) => item.value === widget.customAnimationLottie)}
                        onChange={({ target }) => { updateWidget('customAnimationLottie', target.value) }}
                        onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-customAnimationLottie-help', returnDefault: 'nothing' }))}
                    />
                    <InputGroup
                        id="customAnimationLottie"
                        name="customAnimationLottie"
                        label="customAnimationLottie"
                        feedback={errors?.customAnimationLottie}
                        status={errors?.customAnimationLottie && 'error'}
                        value={widget.customAnimationLottie}
                        onChange={({ target }) => { updateWidget('customAnimationLottie', target.value) }}
                        onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-customAnimationLottie-help', returnDefault: 'nothing' }))}
                    />
                    <Grid>
                        <Button id="try-widget-win-animation" onClick={() => tryAnimation()}>
                            <Typography
                                translateGroup="widget-animation-setup"
                                translateKey="try-win-animation"
                            />
                        </Button>
                    </Grid>
                </Grid>
            </Grid>

        </Grid>
    )
}
