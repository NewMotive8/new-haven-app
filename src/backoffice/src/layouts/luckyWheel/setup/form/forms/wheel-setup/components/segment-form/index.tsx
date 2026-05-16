import Card from 'components/cards/card'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import EditorGroup from 'components/uiKit/inputs/Editor'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import RangeInput from 'components/uiKit/inputs/inputGroup/variants/rangeInput'
import Toggle from 'components/uiKit/inputs/Toggle'
import Typography from 'components/uiKit/typography'
import React, { useState } from 'react'
import { BsXLg } from 'react-icons/bs'
import { IoSaveOutline } from 'react-icons/io5'
import { WheelDTO, WheelSegmentDTO } from 'utils/services/api/requests/luckWheel/wheel'

interface Props {
    setSelectedItem: Function,
    close: Function,
    currentSegment: WheelSegmentDTO,
    segmentIndex: number,
}

export default function SegmentsForm(props: Props) {
    const {
        segmentIndex,
        setSelectedItem,
        close,
        currentSegment,
    } = props

    const [formData, setFormData] = useState(currentSegment)


    function updateField(fieldName: string, value: any) {
        setFormData((d: any) => { return { ...d, [fieldName]: value } })
    }

    function handleSave() {
        setSelectedItem((d: WheelDTO) => {
            const updatedSegments = d.wheelSegments.map((segment: WheelSegmentDTO, index: number) => {
                if (index === segmentIndex) {
                    return { ...segment, ...formData }
                }
                return segment
            })
            return { ...d, wheelSegments: updatedSegments }
        })
        close()
    }



    return (
        <Card
            style={{
                width: '600px',
                maxWidth: 'calc(100vw - 2rem)',
            }}
            color='section'
        >
            <Grid gap='2rem'>
                <Grid>
                    <Typography
                        translateGroup="wheel-setup"
                        translateKey="customize-the-segment"
                        size={'md'}
                    />
                </Grid>
                <Grid gap='1rem'>
                    <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)' }}>
                        <InputGroup
                            id="text"
                            name="text"
                            label="text"
                            value={formData?.text}
                            onChange={({ target }) => { updateField(target.name, target.value) }}
                        />
                    </Grid>
                    <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)' }}>
                        <InputGroup
                            id="icon"
                            name="icon"
                            label="icon"
                            value={formData?.icon}
                            onChange={({ target }) => { updateField(target.name, target.value) }}
                        />
                    </Grid>
                    <Grid>
                        <EditorGroup
                            id='winMessageContent'
                            name='winMessageContent'
                            value={formData?.winMessageContent}
                            label={'win-message-content'}
                            onChange={({ target }) => updateField(target.name, target.value)}
                        />
                    </Grid>
                    <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)' }}>
                        <InputGroup
                            id="startBgColor"
                            name="startBgColor"
                            label="startBgColor"
                            inputType='color'
                            value={formData?.startBgColor}
                            onChange={({ target }) => { updateField(target.name, target.value) }}
                        />
                    </Grid>
                    <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)' }}>
                        <InputGroup
                            id="endBgColor"
                            name="endBgColor"
                            label="endBgColor"
                            value={formData?.endBgColor}
                            inputType='color'
                            onChange={({ target }) => { updateField(target.name, target.value) }}
                        />
                    </Grid>
                    <Grid>
                        <InputGroup
                            id="payoutId"
                            name="payoutId"
                            label="payoutId"
                            value={formData?.payoutId}
                            onChange={({ target }) => { updateField(target.name, target.value) }}
                        />
                    </Grid>
                    <Grid gap='1rem'>
                        <Grid width={'calc(40% - (2rem / 3))'}>
                            <RangeInput
                                id='probability'
                                label={'probability'}
                                max={100}
                                min={0}
                                name='probability'
                                step={0.01}
                                value={formData?.probability}
                                onChange={({ target }) => { updateField(target.name, target.value) }}
                            />
                        </Grid>
                        <Grid width={'calc(30% - (2rem / 3))'}>
                            <Toggle
                                id='isNextTier'
                                label={'is-next-tier'}
                                name='isNextTier'
                                value={formData?.isNextTier}
                                onChange={({ target }) => { updateField(target.name, target.value) }}
                            />
                        </Grid>
                        <Grid width={'calc(30% - (2rem / 3))'}>
                            <Toggle
                                id='isRespin'
                                label={'is-re-spin'}
                                name='isRespin'
                                value={formData?.isRespin}
                                onChange={({ target }) => { updateField(target.name, target.value) }}
                            />
                        </Grid>
                    </Grid>
                </Grid>
                <Grid>
                    <Grid wrap="nowrap" margin={['mt-5', 'mb-3']} horizontalAlgin="space-between">
                        <Grid horizontalAlgin="flex-start" verticalAlgin="center" gap="0.5rem">
                            <Button
                                id="crud-cancelButton"
                                onClick={() => close()}
                                type="button"
                                color="primary-outline"
                            >
                                <Grid wrap="nowrap" gap="0.25rem" horizontalAlgin="center" verticalAlgin="center">
                                    <BsXLg />
                                    <Typography
                                        translateGroup="global"
                                        translateKey="cancel"
                                    />
                                </Grid>
                            </Button>

                        </Grid>
                        <Button
                            id="crud-button-submit"
                            disabled={!formData.icon && !formData.text}
                            color="primary"
                            onClick={() => handleSave()}
                        >
                            <Grid wrap="nowrap" gap="0.25rem" horizontalAlgin="center" verticalAlgin="center">
                                <IoSaveOutline />
                                <Typography
                                    translateGroup="global"
                                    translateKey="save"
                                />

                            </Grid>
                        </Button>
                    </Grid>
                </Grid>
            </Grid>
        </Card>
    )
}
