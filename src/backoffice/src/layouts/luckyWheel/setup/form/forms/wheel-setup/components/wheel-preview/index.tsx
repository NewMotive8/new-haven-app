import Grid from 'components/uiKit/grid'
import { LWSetupContext } from 'layouts/luckyWheel/setup'
import React, { useContext, useEffect, useState } from 'react'
import SegmentsForm from '../segment-form'
import { DotDTO, TickerDTO, WheelSegmentDTO } from 'utils/services/api/requests/luckWheel/wheel'
import DialogContext from 'context/dialog'
import SelectGroup from 'components/uiKit/inputs/selectGroup'
import Button from 'components/uiKit/buttons'
import Typography from 'components/uiKit/typography'
import ApplyDefault from './applyDefault'


interface renderWheelI {
    target: string | HTMLElement;
    containerSize?: number;
    wheelSegments?: any[];
    tierScale?: string | number[];
    dot?: DotDTO;
    borderColor?: string;
    borderWidth?: number;
    renderStripes?: boolean[] | string;
    ticker?: TickerDTO;
}


declare global {
    interface Window {
        renderWheelMultiTier: (p: renderWheelI) => any,
        engagdSpinWheel: Function,
    }
}

export default function WheelPreview() {
    const { selectedItem, setSelectedItem } = useContext(LWSetupContext)
    const { displayDialog, removeDialog } = useContext(DialogContext)
    const [wheelSetup, setWheelSetup] = useState<any>(null)
    const [selectedSegment, setSelectedSegment] = useState<any>()
    console.log('selectedSegment: ', selectedSegment);
    console.log('wheelSetup: ', wheelSetup);

    function handleDisplayDialog(currentSegment: WheelSegmentDTO, segmentIndex: number) {
        displayDialog({
            dialogId: 'SEGMENT-FORM-DIALOG',
            content: (<SegmentsForm
                close={() => removeDialog('SEGMENT-FORM-DIALOG')}
                currentSegment={currentSegment}
                segmentIndex={segmentIndex}
                setSelectedItem={setSelectedItem}
            />),
        })
    }


    useEffect(() => {
        const wheel = document.querySelector('#wheel-wrapper')
        if (wheel) {
            wheel.innerHTML = ''
        }
        if (selectedItem.wheelSegments?.length) {
            window.renderWheelMultiTier({
                target: wheel as HTMLElement,
                containerSize: wheel?.clientWidth,
                ...selectedItem,
                wheelSegments: selectedItem.wheelSegments
                    .map((ws: WheelSegmentDTO, i: number) => ({ ...ws, onClick: () => { handleDisplayDialog(ws, i) } })),
            }).then((data: any) => setWheelSetup(data))
        }
    }, [selectedItem])


    const selectSegmentOptions = wheelSetup && selectedItem.wheelSegments.map((wheelSegment) => {
        return ({ value: wheelSegment.id, label: `Segment ${wheelSegment.order + 1} tier ${wheelSegment.tier}` })
    })
    function handleClickSpin() {
        window.engagdSpinWheel({
            selectedSegment,
            wheelSetup,
            onComplete: () => console.log('spin-wheel-complete'),
            spins: selectedItem.animationSpins,
            duration: selectedItem.animationDuration,
        })
    }
    return (
        <Grid style={{ overflow: 'hidden' }}>
            <Grid horizontalAlgin='center' padding={['pb-5']}>
                <Typography
                    translateGroup="wheel-setup"
                    translateKey="click-on-segment-to-edit"
                    weight={600}
                />
            </Grid>
            <div id='wheel-wrapper' style={{ width: '100%' }} />
            {
                selectSegmentOptions && (
                    <SelectGroup
                        value={selectSegmentOptions.find((item: any) => selectedSegment === item.id)}
                        options={selectSegmentOptions}
                        onChange={({ target }) => setSelectedSegment(target.value)}
                        id='select-segment'
                        name='select-segment'
                    />
                )
            }
            <Button disabled={!selectedSegment} id='spin-wheel-cta' onClick={() => handleClickSpin()}>
                spin
            </Button>
            <Grid padding={['pt-3']}>
                <ApplyDefault />
            </Grid>
        </Grid>
    )
}
