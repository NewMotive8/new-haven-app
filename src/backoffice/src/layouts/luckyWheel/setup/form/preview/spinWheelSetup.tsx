import Card from 'components/cards/card'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import RangeInput from 'components/uiKit/inputs/inputGroup/variants/rangeInput'
import Typography from 'components/uiKit/typography'
import React, { useState } from 'react'

interface Props {
    wheel: HTMLDivElement,
}
export const defaultSpinSetup = {
    winnerIndex: 0,
    spins: 5,
    duration: 15,
    bounce: {
        amplitude: 0.5,
        frequency: 0.35,
    },

}

export default function SpinWheelSetup(props: Props) {
    const { wheel } = props
    const [spinSetup, setSpinSetup] = useState({
        wheel,
        ...defaultSpinSetup,
    })

    function updateField(field: any, value: any) {
        if (['amplitude', 'frequency'].includes(field)) {
            setSpinSetup((current) => ({
                ...current,
                bounce: {
                    ...current.bounce,
                    [field]: value,
                },
            }))
        } else {
            setSpinSetup((current) => ({ ...current, [field]: value }))
        }
    }

    return (
        <Grid>
            <Grid gap="1.5rem">
                <Grid>
                    <InputGroup
                        id="winnerIndex"
                        name="winnerIndex"
                        label="winnerIndex"
                        value={spinSetup.winnerIndex}
                        inputType="number"
                        onChange={({ target }) => { updateField(target.name, target.value) }}
                    />
                </Grid>
                <Grid>
                    <InputGroup
                        id="spins"
                        name="spins"
                        label="spins"
                        value={spinSetup.spins}
                        inputType="number"
                        onChange={({ target }) => { updateField(target.name, target.value) }}
                    />
                </Grid>
                <Grid>
                    <InputGroup
                        id="duration"
                        name="duration"
                        label="duration (seconds)"
                        value={spinSetup.duration}
                        inputType="number"
                        onChange={({ target }) => { updateField(target.name, target.value) }}
                    />
                </Grid>
                <Card color="primary-full">
                    <Grid>
                        <Typography translateGroup="lw-setup" translateKey="bounce-animation-effect" size="sm" />
                    </Grid>
                    <Grid>
                        <RangeInput
                            min={0.01}
                            max={3}
                            step={0.1}
                            id="amplitude"
                            name="amplitude"
                            label="amplitude"
                            value={spinSetup.bounce.amplitude}
                            inputType="number"
                            onChange={({ target }) => { updateField(target.name, target.value) }}
                        />
                    </Grid>
                    <Grid>
                        <RangeInput
                            min={0.01}
                            max={3}
                            step={0.1}
                            id="frequency"
                            name="frequency"
                            label="frequency"
                            value={spinSetup.bounce.frequency}
                            inputType="number"
                            onChange={({ target }) => { updateField(target.name, target.value) }}
                        />
                    </Grid>
                </Card>
                <Grid>
                    <Button id="lw-setup-spin" onClick={() => window.joobaLW.spinWheel(spinSetup)}>
                        <Typography translateGroup="lw-setup" translateKey="spin" />
                    </Button>
                </Grid>
            </Grid>

        </Grid>
    )
}
