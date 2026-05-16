import Grid from 'components/uiKit/grid'
import { LWSetupContext } from 'layouts/luckyWheel/setup'
import React, { useContext, useEffect, useState } from 'react'
import SetupWheelStructure from './components/setup-structure'
import WheelPreview from './components/wheel-preview'
import WheelSettings from './components/wheel-settings'

export default function WheelSetupForm() {
    const { selectedItem, setSelectedItem } = useContext(LWSetupContext)
    
    console.log('selectedItem: ', JSON.stringify(selectedItem));
    useEffect(() => {
        window.setSelectedItem = setSelectedItem
    }, [])
    
    return (
        <Grid gap='1rem' verticalAlgin='flex-start'>
            <Grid verticalAlgin='flex-start' gap='1rem' responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)' }}>
                <SetupWheelStructure />
                <WheelSettings />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)' }}>
                <Grid style={{ maxWidth: '650px' }}>   <WheelPreview /></Grid>
            </Grid>
        </Grid>
    )
}
