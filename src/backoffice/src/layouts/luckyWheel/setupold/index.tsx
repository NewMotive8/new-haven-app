import Card from 'components/cards/card'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import React, { useEffect, useState } from 'react'
import ExpandCollapseCard from 'components/cards/expandCollapseCard'
import SegmentsForm from './segmentForm'
import SpinWheelSetup, { defaultSpinSetup } from './spinWheelSetup'
import { exampleSetup } from './exampleSetup'

export default function SetupLuckyWheelLayout() {
    const [wheels, setWheels] = useState([])
    const [configurations, setConfigurations] = useState([...exampleSetup])

    function renderLW() {
        const container: HTMLElement = document.getElementById('lucky-wheel-container') as HTMLElement
        const containerBounds = container.getBoundingClientRect()
        const wheelsA: any = window?.joobaLW?.mountMultipleWheels({
            container,
            configurations,
            wrapperSize: containerBounds.width,
        })
        setWheels(wheelsA)
    }

    useEffect(() => {
        renderLW()
    }, [configurations])

    function spinAllWheels() {
        const spinsSetup = wheels.map(({ wheel }: any) => {
            return ({
                ...defaultSpinSetup,
                wheel,
                winnerIndex: 1,
            } as any)
        })
        window.joobaLW.spinMultipleWheelsSequentially(spinsSetup)
    }

    return (
        <Card color="secondary">
            <Grid gap="1.5rem" verticalAlgin="flex-start">
                <Grid gap="1rem" responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}>
                    <Button id="render-lw-cta" onClick={() => renderLW()}>
                        <Typography translateGroup="lw-setup" translateKey="render-lw" />
                    </Button>
                    <SegmentsForm configurations={configurations} setConfigurations={setConfigurations} />
                </Grid>
                <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}>
                    <div style={{ width: '100%', display: 'block', position: 'relative' }}>
                        <div id="lucky-wheel-container" style={{ width: '100%' }} />
                    </div>
                    <Grid>
                        <Button id="spin-all-cta" onClick={() => spinAllWheels()}>
                            <Typography translateGroup="lw-setup" translateKey="spin-all-example" />
                        </Button>
                    </Grid>
                    {
                        wheels?.map((wheelElements, wheelIndex) => {
                            const { wheel } = wheelElements
                            return (
                                <ExpandCollapseCard
                                    header={(
                                        <Grid>
                                            <Typography
                                                translateGroup="lw-setup"
                                                translateKey="spin-wheel"
                                                replaces={[
                                                    { code: '{{wheelIndex}}', value: wheelIndex },
                                                    { code: '{{wheelNumber}}', value: (1 + wheelIndex) },
                                                ]}
                                                returnDefault="defaultContent"
                                                defaultContent={`Spin Wheel ${wheelIndex + 1}`}
                                            />
                                        </Grid>
                                    )}
                                    color="primary-outline"
                                    key={wheelIndex}
                                >
                                    <SpinWheelSetup wheel={wheel} />
                                </ExpandCollapseCard>
                            )
                        })
                    }
                </Grid>
            </Grid>
        </Card>
    )
}
