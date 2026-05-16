import Grid from 'components/uiKit/grid'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import Toggle from 'components/uiKit/inputs/Toggle'
import { LWSetupContext } from 'layouts/luckyWheel/setup'
import React, { useContext, useEffect, useState } from 'react'

declare global {
    interface Window {
        setSelectedItem: Function
    }
}

export default function WheelInfoForm() {
    const { selectedItem, setSelectedItem } = useContext(LWSetupContext)
    const [errors, setErrors] = useState<any>()

    function updateWheel(field: string, value: any) {
        setSelectedItem((current: any) => {
            return ({
                ...current,
                [field]: value,
            })
        })
    }

    return (
        <Grid gap="1rem">
            <Grid width="100%">
                <InputGroup
                    id="internalName"
                    name="internalName"
                    label="Internal Name"
                    feedback={errors?.internalName}
                    status={errors?.internalName && 'error'}
                    value={selectedItem.internalName}
                    onChange={({ target }) => { updateWheel(target.name, target.value) }}
                />
            </Grid>
            <Grid width="100%">
                <InputGroup
                    id="internalDescription"
                    name="internalDescription"
                    label="Internal Description"
                    feedback={errors?.internalDescription}
                    status={errors?.internalDescription && 'error'}
                    value={selectedItem.internalDescription}
                    onChange={({ target }) => { updateWheel(target.name, target.value) }}
                />
            </Grid>
            <Grid width="100%">
                <InputGroup
                    id="externalName"
                    name="externalName"
                    label="External Name"
                    feedback={errors?.externalName}
                    status={errors?.externalName && 'error'}
                    value={selectedItem.externalName}
                    onChange={({ target }) => { updateWheel(target.name, target.value) }}
                />
            </Grid>
            <Grid width="100%">
                <InputGroup
                    id="externalId"
                    name="externalId"
                    label="External ID"
                    feedback={errors?.externalId}
                    status={errors?.externalId && 'error'}
                    value={selectedItem.externalId}
                    onChange={({ target }) => { updateWheel(target.name, target.value) }}
                />
            </Grid>
            <Grid width="100%" gap="1rem">
                <Toggle
                    label="Enabled"
                    id="enabled"
                    name="enabled"
                    value={!!selectedItem.enabled}
                    onChange={({ target }) => updateWheel('enabled', target.value)}
                />
                <Toggle
                    label="Visible"
                    id="visible"
                    name="visible"
                    value={!!selectedItem.isVisible}
                    onChange={({ target }) => updateWheel('isVisible', target.value)}
                />
            </Grid>
        </Grid>
    )
}
