import Grid from 'components/uiKit/grid'
import React, { useContext, useEffect, useState } from 'react'
import Button from 'components/uiKit/buttons'
import Typography from 'components/uiKit/typography'
import ExpandCollapseCard from 'components/cards/expandCollapseCard'
import { LWSetupContext } from '../..'
import SpinWheelSetup, { defaultSpinSetup } from './spinWheelSetup'

export default function LwPreview() {
    const { selectedItem, setSelectedItem } = useContext(LWSetupContext)
    const [wheels, setWheels] = useState([])

    function renderLW() {
        const container: HTMLElement = document.getElementById('lucky-wheel-container') as HTMLElement
        const containerBounds = container.getBoundingClientRect()
        const wheelsA: any = window?.joobaLW?.mountMultipleWheels({
            container,
            configurations: (selectedItem),
            wrapperSize: containerBounds.width,
        })
        setWheels(wheelsA)
    }

    useEffect(() => {
        renderLW()
    }, [selectedItem])

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
        <Grid>
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
    )
}
