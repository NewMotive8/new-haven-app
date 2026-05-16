import Card from 'components/cards/card';
import Button from 'components/uiKit/buttons';
import Grid from 'components/uiKit/grid'
import InputGroup from 'components/uiKit/inputs/inputGroup';
import Typography from 'components/uiKit/typography';
import DialogContext from 'context/dialog';
import { LWSetupContext } from 'layouts/luckyWheel/setup'
import React, { useContext, useState } from 'react'
import { BsPlusCircle } from 'react-icons/bs';
import { defaultWheelSegment, WheelSegmentDTO, WheelDTO } from 'utils/services/api/requests/luckWheel/wheel';


interface DialogI {
    selectedItem: WheelDTO,
    setSelectedItem: Function,
    close: Function,
}


function SetupWheelStructureDialog({ selectedItem, setSelectedItem, close }: DialogI) {
    const currentSegments = selectedItem.wheelSegments || []

    function groupSegments() {
        const group = currentSegments.reduce((grouped: any, segment) => {
            if (!grouped[segment.tier]) {
                grouped[segment.tier] = [];
            }
            grouped[segment.tier].push(segment);
            return grouped;
        }, {});
        return Object.keys(group)
            .map(tier => (group[tier]))
            .sort((a, b) => a.tier - b.tier);
    }
    const currentGroupedSegments: any = groupSegments()
    const currentItemsPerGroup = currentGroupedSegments.map((item: any) => item.length)

    const [segmentsPerTier, setSegmentsPerTier] = useState<number[]>(currentItemsPerGroup || [])

    function setupSegmentsStructure(): WheelSegmentDTO[] {
        const segments: WheelSegmentDTO[] = currentSegments || [];
        segmentsPerTier.forEach((segmentsNumber, i) => {
            const tier = i + 1
            const currentSegments = [...segments.filter((segment) => segment.tier === tier)]
            const missingSegments = segmentsNumber - currentSegments.length;

            if (missingSegments < 0) {
                const newCurrentSegments = [...currentSegments.slice(0, currentSegments.length + missingSegments)];
                const newSegments = [...segments.filter((item) => item.tier !== tier), ...newCurrentSegments]
                segments.splice(0, segments.length)
                segments.push(...newSegments)
            }
            if (missingSegments > 0) {
                for (let i = 0; i < missingSegments; i++) {
                    const newSegment = {
                        ...{
                            ...defaultWheelSegment,
                            id: `temp-id-${tier}-${i}`,
                            text: `${defaultWheelSegment.text} ${currentGroupedSegments.length + i + 1}`
                        }, tier, order: currentSegments.length + i
                    };
                    segments.push(newSegment);
                }
            }
        })
        return segments;
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
                        translateKey="define-the-number-of-tiers-and-segments"
                        size={'md'}
                    />
                </Grid>

                <Grid gap='1rem'>
                    {
                        segmentsPerTier.map((segmentsNumber, i) => (
                            <Grid key={i} margin="mb-2">
                                <InputGroup
                                    id={`segments-per-tier-${i}`}
                                    name={`segments-per-tier-${i}`}
                                    label={`segments per tier - ${i + 1}`}
                                    value={segmentsNumber}
                                    inputType='number'
                                    onChange={(e) => setSegmentsPerTier((current) => {
                                        const newArray = [...current];
                                        newArray[i] = parseInt(e.target.value);
                                        return newArray;
                                    })}
                                />
                            </Grid>
                        ))
                    }
                    <Grid horizontalAlgin='flex-end'>
                        <Button color='primary-outline' id='add-cta' onClick={() => setSegmentsPerTier((current) => ([...current, 0]))}>
                            <Grid
                                wrap="nowrap"
                                gap="0.25rem"
                                horizontalAlgin="center"
                                verticalAlgin="center"
                            >
                                <BsPlusCircle />
                                <Typography
                                    translateGroup="wheel-setup"
                                    translateKey="add-tier"
                                    weight={600}
                                />
                            </Grid>
                        </Button>
                    </Grid>
                </Grid>
                <Grid>
                    <Button
                        id='apply-cta'
                        onClick={() => {
                            setSelectedItem({ ...selectedItem, wheelSegments: setupSegmentsStructure() })
                            close()
                        }}
                    >
                        <Typography
                            translateGroup="wheel-setup"
                            translateKey="apply-setup"
                            weight={600}
                        />
                    </Button>
                </Grid>
            </Grid>
        </Card>
    )
}



export default function SetupWheelStructure() {
    const { selectedItem, setSelectedItem } = useContext(LWSetupContext)

    const { displayDialog, removeDialog } = useContext(DialogContext)

    function handleDisplayDialog() {
        displayDialog({
            dialogId: 'SETUP-WHEEL-STRUCTURE',
            content: (<SetupWheelStructureDialog selectedItem={selectedItem} setSelectedItem={setSelectedItem} close={() => removeDialog('SETUP-WHEEL-STRUCTURE')} />),
        })
    }

    return (
        <Grid>
            <Button block id='alter-segments-and-tier-number' onClick={() => handleDisplayDialog()}>
                <Typography
                    translateGroup="wheel-setup"
                    translateKey="setup-tier-segments-number"
                    weight={600}
                />
            </Button>
        </Grid>
    )
}
