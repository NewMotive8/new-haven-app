import React, { useContext, useState } from 'react'
import Grid from 'components/uiKit/grid'
import TypeButton from 'components/uiKit/inputs/TypeButton'
import Typography from 'components/uiKit/typography'
import { luckWheelApi } from 'utils/services/api/requests/luckWheel/wheel'
import Button from 'components/uiKit/buttons'
import WheelInfoForm from './forms/wheel-info'
import { LWSetupContext } from '..'
import WheelSetupForm from './forms/wheel-setup'

type formsKeys = 'wheel-info' | 'wheel-setup'

const forms = {
    'wheel-info': <WheelInfoForm />,
    'wheel-setup': <WheelSetupForm />,
}


export default function LWSetupForm() {
    const { selectedItem, setSelectedItem } = useContext(LWSetupContext)
    const [currentForm, setCurrentForm] = useState<formsKeys>('wheel-info')

    const formOptions = [
        { enabled: true, value: 'wheel-info', label: <Typography translateGroup="lw-form-options" translateKey="wheel-info" /> },
        {
            enabled: true,
            disabled: !selectedItem.internalName,
            value: 'wheel-setup', label: <Typography translateGroup="lw-form-options" translateKey="wheel-setup" />
        },
    ]

    function handleSubmit() {
        luckWheelApi.submitWheelForm(selectedItem, {
            successCallBack: (responseItem: any) => {
                setSelectedItem(responseItem)
            },
        })
    }

    return (
        <Grid gap="2rem">
            <Grid>
                <TypeButton
                    name="currentForm"
                    onChange={({ target }) => setCurrentForm(target.value)}
                    options={formOptions.filter(({ value, label, enabled }) => enabled && ({ value, label }))}
                    value={currentForm}
                />
            </Grid>
            <Grid gap="1.5rem" verticalAlgin="flex-start">
                {forms[currentForm]}
            </Grid>
            <Grid padding={['pt-3']}>
                <Button id="save-wheel-cta" onClick={() => handleSubmit()}>
                    <Typography translateGroup="lw-wheel-form" translateKey="save" />
                </Button>
            </Grid>
        </Grid>
    )
}
