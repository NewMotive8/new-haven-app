import React from 'react'
import Grid from 'components/uiKit/grid'
import { textTranslated } from 'components/TextTranslated'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import { CrudContext } from '../..'
import { FormContext } from '..'
import Typography from 'components/uiKit/typography'

export default function BasicTab() {
    const {
        selectedItem,
    } = React.useContext(CrudContext)
    const {
        errors,
        updateField,
        setCurrentInfo
    } = React.useContext(FormContext)
    return (
        <Grid gap="1rem" verticalAlgin='flex-start'>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)' }}>
                <InputGroup
                    id="instantWin"
                    name="instantWin"
                    label="instantWin"
                    inputType='datetime-local'
                    feedback={<Typography {...errors?.instantWin} />}
                    status={errors?.instantWin && 'error'}
                    value={selectedItem?.instantWin}
                    onChange={({ target }) => { updateField(target.name, target.value) }}
                />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)' }}>
                <InputGroup
                    id="status"
                    name="status"
                    label="status"
                    feedback={<Typography {...errors?.status} />}
                    status={errors?.status && 'error'}
                    value={selectedItem?.status}
                    onChange={({ target }) => { updateField(target.name, target.value) }}
                />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)' }}>
                <InputGroup
                    id="raffleInstanceId"
                    name="raffleInstanceId"
                    label="raffleInstanceId"
                    feedback={<Typography {...errors?.raffleInstanceId} />}
                    status={errors?.raffleInstanceId && 'error'}
                    value={selectedItem?.raffleInstanceId}
                    onChange={({ target }) => { updateField(target.name, target.value) }}
                />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)' }}>
                <InputGroup
                    id="createdDate"
                    name="createdDate"
                    label="createdDate"
                    inputType='datetime-local'
                    feedback={<Typography {...errors?.createdDate} />}
                    status={errors?.createdDate && 'error'}
                    value={selectedItem?.createdDate}
                    onChange={({ target }) => { updateField(target.name, target.value) }}
                />
            </Grid>
        </Grid>
    )
}
