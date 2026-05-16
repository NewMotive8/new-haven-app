import Grid from 'components/uiKit/grid'
import { LWSetupContext } from 'layouts/luckyWheel/setup'
import React, { useContext, useEffect } from 'react'
import { BooleanArrayInput } from './components/ArrayBooleanInput'
import { WheelDTO } from 'utils/services/api/requests/luckWheel/wheel';
import InputGroup from 'components/uiKit/inputs/inputGroup';
import RangeInput from 'components/uiKit/inputs/inputGroup/variants/rangeInput';
import { RangeArrayInput } from './components/ArrayRangeInput';

export const getTierCount = (wheel: WheelDTO): number => {
    const uniqueTiers = new Set(wheel.wheelSegments.map(segment => segment.tier));
    return uniqueTiers.size;
};
export default function WheelSettings() {
    const { selectedItem, setSelectedItem } = useContext(LWSetupContext)
    console.log('selectedItem: ', selectedItem);
    const numberOfTiers = getTierCount(selectedItem)


    function updateField(fieldName: string, value: any) {
        setSelectedItem((d: any) => { return { ...d, [fieldName]: value } })
    }

    function updateDot(fieldName: string, value: any) {
        setSelectedItem((d: any) => { return { ...d, dot: { ...d.dot, [fieldName]: value } } })
    }
    function updateTicker(fieldName: string, value: any) {
        setSelectedItem((d: any) => { return { ...d, ticker: { ...d.ticker, [fieldName]: value } } })
    }
    useEffect(() => {
        const renderStripes = selectedItem.renderStripes ? JSON.parse(selectedItem.renderStripes) : []
        if (renderStripes.length !== numberOfTiers) {
            let newRenderStripes = []
            for (let i = 0; i < numberOfTiers; i++) {
                newRenderStripes.push(true)
            }
            updateField('renderStripes', JSON.stringify(newRenderStripes))
        }

        const renderDot = selectedItem.dot.render ? JSON.parse(selectedItem.dot.render) : []
        if (renderDot.length !== numberOfTiers) {
            let newRenderDot = []
            for (let i = 0; i < numberOfTiers; i++) {
                newRenderDot.push(!i)
            }
            updateDot('render', JSON.stringify(newRenderDot))
        }

        const defaultTierScale = [0.9, 0.65, 0.4, 0.2];
        const tierScale = selectedItem.tierScale ? JSON.parse(selectedItem.tierScale) : [];
        if (tierScale.length !== numberOfTiers) {
            let newTierScale = [];
            for (let i = 0; i < numberOfTiers; i++) {
                newTierScale.push(
                    tierScale[i] !== undefined
                        ? tierScale[i]
                        : (defaultTierScale[i] !== undefined
                            ? defaultTierScale[i]
                            : 1 / (i + 4))
                )
            }
            updateField('tierScale', JSON.stringify(newTierScale));
        }


    }, [numberOfTiers])


    return (
        <Grid gap='1rem'>
            <Grid gap='1rem'>
                <Grid>
                    <InputGroup
                        id="widgetImage"
                        name="widgetImage"
                        label="widgetImage"
                        value={selectedItem?.widgetImage}
                        onChange={({ target }) => { updateField(target.name, target.value) }}
                    />
                </Grid>
                <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)' }} padding={['pt-2']}>
                    <BooleanArrayInput
                        id='renderStripes'
                        name='renderStripes'
                        label='render-wheel-stripes'
                        value={selectedItem.renderStripes}
                        onChange={(newValue) => updateField('renderStripes', newValue)}
                    />
                </Grid>
                <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)' }} padding={['pt-2']}>
                    <BooleanArrayInput
                        id='renderDot'
                        name='renderDot'
                        label='render-wheel-dots'
                        value={selectedItem.dot.render}
                        onChange={(newValue) => updateDot('render', newValue)}
                    />
                </Grid>
                <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)' }} padding={['pt-2']}>
                    <InputGroup
                        id="borderColor"
                        name="borderColor"
                        label="borderColor"
                        inputType='color'
                        value={selectedItem.borderColor}
                        onChange={({ target }) => { updateField(target.name, target.value) }}
                    />
                </Grid>
                <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)' }} padding={['pt-2']}>
                    <RangeInput
                        max={100}
                        min={0}
                        step={0.1}
                        id="borderWidth"
                        name="borderWidth"
                        label="borderWidth"
                        value={selectedItem.borderWidth}
                        onChange={({ target }) => { updateField(target.name, target.value) }}
                    />
                </Grid>
                <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)' }} padding={['pt-2']}>
                    <RangeInput
                        max={100}
                        min={0}
                        step={1}
                        id="dotSize"
                        name="dotSize"
                        label="dotSize"
                        value={100 - selectedItem.dot.size}
                        onChange={({ target }) => { updateDot('size', 100 - (parseInt(target?.value || '0'))) }}
                    />
                </Grid>
                <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)' }} padding={['pt-2']}>
                    <InputGroup
                        id="dotColor"
                        name="dotColor"
                        label="dotColor"
                        inputType='color'
                        value={selectedItem.dot.color}
                        onChange={({ target }) => { updateDot('color', target.value) }}
                    />
                </Grid>
                <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)' }} padding={['pt-2']}>
                    <RangeInput
                        max={10}
                        min={0.1}
                        step={0.1}
                        id="tickerSize"
                        name="tickerSize"
                        label="tickerSize"
                        value={(13 - selectedItem.ticker.size).toFixed(2)}
                        onChange={({ target }) => { updateTicker('size', 13 - (parseFloat(target?.value || '0'))) }}
                    />
                </Grid>
                <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)' }} padding={['pt-2']}>
                    <InputGroup
                        id="tickerColor"
                        name="tickerColor"
                        label="tickerColor"
                        inputType='color'
                        value={selectedItem.ticker.color}
                        onChange={({ target }) => { updateTicker('color', target.value) }}
                    />
                </Grid>
                <Grid>
                    <RangeArrayInput
                        inputProps={{
                            min: 0.01,
                            max: 1,
                            step: 0.01
                        }}
                        id='tierScale'
                        name='tierScale'
                        label='tier-wheel-scale'
                        value={selectedItem.tierScale}
                        onChange={(newValue) => updateField('tierScale', newValue)}
                    />
                </Grid>
                <Grid gap='1rem'>
                    <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)' }}>
                        <RangeInput
                            min={4}
                            max={20}
                            step={1}
                            id="animationSpins"
                            name="animationSpins"
                            label="animationSpins"
                            value={selectedItem?.animationSpins}
                            onChange={({ target }) => { updateField(target.name, target.value) }}
                        />
                    </Grid>
                    <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)' }}>
                        <RangeInput
                            min={4}
                            max={20}
                            step={1}
                            id="animationDuration"
                            name="animationDuration"
                            label="animationDuration"
                            value={selectedItem?.animationDuration}
                            onChange={({ target }) => { updateField(target.name, target.value) }}
                        />
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    )
}
