import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import React, { useContext } from 'react'
import { BsArrowLeftCircle } from 'react-icons/bs'
import { LWSetupContext } from '..'

export default function LWSetupHeader() {
    const { selectedItem, setSelectedItem } = useContext(LWSetupContext)
    return (
        <Grid>
            <Grid wrap="nowrap" gap="0.5rem" verticalAlgin="center">
                {selectedItem && <BsArrowLeftCircle size={25} onClick={() => setSelectedItem(null)} />}
                <Typography
                    translateGroup="lucky-wheel"
                    translateKey="lucky-wheel"
                    weight={600}
                    elementType="h5"
                    margin="mb-1"
                    style={{
                        textTransform: 'capitalize',
                        width: '100%',
                    }}
                />

            </Grid>
            <Typography
                translateGroup="lucky-wheel"
                translateKey="lucky-wheel-administration"
                weight={400}
                elementType="p"
                margin="mb-3"
                style={{
                    textTransform: 'capitalize',
                }}
            />
        </Grid>
    )
}
