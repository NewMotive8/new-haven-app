/* eslint-disable no-plusplus */
/* eslint-disable no-multi-assign */
import Card from 'components/cards/card'
import ExpandCollapseCard from 'components/cards/expandCollapseCard'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import RangeInput from 'components/uiKit/inputs/inputGroup/variants/rangeInput'
import TypeButton from 'components/uiKit/inputs/TypeButton'
import Typography from 'components/uiKit/typography'
import React from 'react'

interface Props {
    configurations: any;
    setConfigurations: any;
}

function SegmentsForm({ configurations, setConfigurations }: Props) {
    const handleChange = (configIndex: any, segmentIndex: any, field: string, value: any) => {
        const newConfigurations = [...configurations]
        const fields = field.split('.')

        if (segmentIndex === null) {
            let config = newConfigurations[configIndex]
            for (let i = 0; i < fields.length - 1; i++) {
                config = config[fields[i]] = config[fields[i]] ?? {}
            }
            config[fields[fields.length - 1]] = value
        } else if (['color', 'background', 'bottom', 'left', 'width'].includes(field)) {
            newConfigurations[configIndex].segments[segmentIndex].style[field] = value
        } else {
            newConfigurations[configIndex].segments[segmentIndex][field] = value
        }
        setConfigurations(newConfigurations)
    }

    const handleAddSegment = (configIndex: any) => {
        const newConfigurations = [...configurations]
        newConfigurations[configIndex].segments.push({
            text: '',
            icon: '',
            style: {
                color: '',
                background: '#00000017',
                bottom: '',
                left: '',
                width: '',
            },
        })
        setConfigurations(newConfigurations)
    }

    const handleRemoveSegment = (configIndex: any, segmentIndex: any) => {
        const newConfigurations = [...configurations]
        newConfigurations[configIndex].segments.splice(segmentIndex, 1)
        setConfigurations(newConfigurations)
    }

    const handleAddConfiguration = () => {
        setConfigurations([...configurations, {
            sizeMultiplier: 1,
            segments: [],
        }])
    }

    const handleRemoveConfiguration = (index: any) => {
        const newConfigurations = configurations.filter((_: any, i: any) => i !== index)
        setConfigurations(newConfigurations)
    }

    const selectorOptions = [
        { value: 'top', label: <Typography translateGroup="lw-setup" translateKey="selector-top" /> },
        { value: 'center', label: <Typography translateGroup="lw-setup" translateKey="selector-center" /> },
    ]

    return (
        <Grid gap="1rem">
            {
                configurations?.map((wheel: any, wheelIndex: number) => (
                    <ExpandCollapseCard
                        color="primary-outline"
                        header={(
                            <Grid wrap="nowrap">
                                <Grid>
                                    <Typography
                                        translateGroup="lw-setup"
                                        translateKey="wheel"
                                        replaces={[
                                            { code: '{{wheelIndex}}', value: wheelIndex },
                                            { code: '{{wheelNumber}}', value: (1 + wheelIndex) },
                                        ]}
                                        returnDefault="defaultContent"
                                        defaultContent={`Wheel ${wheelIndex + 1}`}
                                    />
                                </Grid>
                                <Grid width="fit-content" padding={['pe-5']}>
                                    <Button id="remove-wheel-cta" color="danger-outline" onClick={() => handleRemoveConfiguration(wheelIndex)}>
                                        <Typography translateGroup="lw-setup" translateKey="remove-wheel" />
                                    </Button>
                                </Grid>
                            </Grid>
                        )}
                    >
                        <Grid key={wheelIndex}>
                            <Card color="section">
                                <Grid>
                                    <RangeInput
                                        min={0.1}
                                        max={1}
                                        step={0.1}
                                        id="sizeMultiplier"
                                        name="sizeMultiplier"
                                        label="wheel-size-multiplier"
                                        value={wheel.sizeMultiplier}
                                        onChange={(e) => handleChange(wheelIndex, null, 'sizeMultiplier', parseFloat(e.target.value))}
                                    />
                                </Grid>
                                <ExpandCollapseCard
                                    color="root"
                                    header={<Typography translateGroup="lw-setup" translateKey="wheel-style" />}
                                >
                                    <Grid gap="1rem">
                                        <Grid>
                                            <InputGroup
                                                id="backgroundColor"
                                                name="backgroundColor"
                                                label="backgroundColor"
                                                inputType="color"
                                                value={wheel?.style?.backgroundColor}
                                                onChange={(e) => handleChange(wheelIndex, null, 'style.backgroundColor', (e.target.value))}
                                            />
                                        </Grid>
                                        <Grid>
                                            <InputGroup
                                                id="backgroundImage"
                                                name="backgroundImage"
                                                label="backgroundImage"
                                                value={wheel?.style?.backgroundImage}
                                                onChange={(e) => handleChange(wheelIndex, null, 'style.backgroundImage', (e.target.value))}
                                            />
                                        </Grid>
                                    </Grid>
                                </ExpandCollapseCard>
                                <ExpandCollapseCard
                                    color="root"
                                    header={<Typography translateGroup="lw-setup" translateKey="wheel-border" />}
                                >
                                    <Grid gap="1rem">
                                        <Grid>
                                            <InputGroup
                                                id="backgroundImage"
                                                name="backgroundImage"
                                                label="backgroundImage"
                                                value={wheel?.border?.backgroundImage}
                                                onChange={(e) => handleChange(wheelIndex, null, 'border.backgroundImage', (e.target.value))}
                                            />
                                        </Grid>
                                    </Grid>
                                </ExpandCollapseCard>
                                <ExpandCollapseCard
                                    color="root"
                                    header={<Typography translateGroup="lw-setup" translateKey="wheel-selector" />}
                                >
                                    <Grid gap="1rem">
                                        <Grid>
                                            <TypeButton
                                                name="selector-position"
                                                onChange={(e) => handleChange(wheelIndex, null, 'selector.position', (e.target.value))}
                                                options={selectorOptions}
                                                value={wheel?.selector?.position}
                                            />
                                        </Grid>
                                        <Grid>
                                            <InputGroup
                                                id="imgUrl"
                                                name="imgUrl"
                                                label="selector-img-url"
                                                value={wheel?.selector?.imgUrl}
                                                onChange={(e) => handleChange(wheelIndex, null, 'selector.imgUrl', (e.target.value))}
                                            />
                                        </Grid>
                                        <Grid>
                                            <RangeInput
                                                min={0.1}
                                                max={0.5}
                                                step={0.01}
                                                id="sizeMultiplier"
                                                name="sizeMultiplier"
                                                label="selector-sizeMultiplier"
                                                value={wheel?.selector?.sizeMultiplier}
                                                onChange={(e) => handleChange(wheelIndex, null, 'selector.sizeMultiplier', (e.target.value))}
                                            />
                                        </Grid>
                                    </Grid>
                                </ExpandCollapseCard>

                                <Grid>
                                    <Typography translateGroup="luck-wheel-setup" translateKey="segments" weight={600} />
                                </Grid>
                                {
                                    wheel?.segments?.map((segment: any, segmentIndex: any) => (
                                        <ExpandCollapseCard
                                            header={(
                                                <Grid>
                                                    <Typography
                                                        translateGroup="lw-setup"
                                                        translateKey="segment"
                                                        replaces={[
                                                            { code: '{{segmentIndex}}', value: segmentIndex },
                                                            { code: '{{segmentNumber}}', value: (1 + segmentIndex) },
                                                        ]}
                                                        returnDefault="defaultContent"
                                                        defaultContent={`Segment ${segmentIndex + 1}`}
                                                    />
                                                </Grid>
                                            )}
                                            color="root"
                                            key={segmentIndex}
                                        >
                                           <Grid gap="1rem">
                                                <Grid wrap="nowrap" gap="1rem">
                                                    <Grid>
                                                        <InputGroup
                                                            id="background"
                                                            name="background"
                                                            label="segment-background"
                                                            value={segment.background}
                                                            inputType="color"
                                                            onChange={(e) => handleChange(wheelIndex, segmentIndex, 'background', e.target.value)}
                                                        />
                                                    </Grid>

                                                </Grid>
                                                <Grid>
                                                    <InputGroup
                                                        id="icon"
                                                        name="icon"
                                                        label="segment-icon-url"
                                                        value={segment.icon}
                                                        onChange={(e) => handleChange(wheelIndex, segmentIndex, 'icon', e.target.value)}
                                                    />
                                                </Grid>
                                                <Grid wrap="nowrap" gap="1rem">
                                                    <Grid>
                                                        <RangeInput
                                                            min={1}
                                                            max={35}
                                                            step={1}
                                                            id="bottom"
                                                            name="bottom"
                                                            label="segment-x"
                                                            value={segment?.style?.bottom}
                                                            onChange={(e) => handleChange(wheelIndex, segmentIndex, 'bottom', e.target.value)}
                                                        />
                                                    </Grid>
                                                    <Grid>
                                                        <RangeInput
                                                            min={1}
                                                            max={35}
                                                            step={1}
                                                            id="left"
                                                            name="left"
                                                            label="segment-y"
                                                            value={segment?.style?.left}
                                                            onChange={(e) => handleChange(wheelIndex, segmentIndex, 'left', e.target.value)}
                                                        />
                                                    </Grid>
                                                    <Grid>
                                                        <RangeInput
                                                            min={1}
                                                            max={35}
                                                            step={1}
                                                            id="width"
                                                            name="width"
                                                            label="segment-size"
                                                            value={segment?.style?.width}
                                                            onChange={(e) => handleChange(wheelIndex, segmentIndex, 'width', e.target.value)}
                                                        />
                                                    </Grid>
                                                </Grid>
                                                <Button color="danger-outline" id="remove-segment-cta" onClick={() => handleRemoveSegment(wheelIndex, segmentIndex)}>Remove Segment</Button>
                                           </Grid>
                                        </ExpandCollapseCard>
                                    ))
                                }
                                <Button id="add-segment-cta" onClick={() => handleAddSegment(wheelIndex)}>Add Segment</Button>
                            </Card>
                        </Grid>
                    </ExpandCollapseCard>
                ))
            }
            <Button
                id="add-wheel-cta"
                onClick={handleAddConfiguration}
            >
                <Typography
                    translateGroup="global"
                    translateKey="add-wheel"
                />
            </Button>
        </Grid>
    )
}

export default SegmentsForm
