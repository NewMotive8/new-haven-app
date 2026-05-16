import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import React, { useContext } from 'react'
import { IoArrowBackCircleOutline } from 'react-icons/io5'
import { DashboardContext } from '..'

export default function DashboardHeader() {
    const { currentJackpot, setCurrentJackpot } = useContext(DashboardContext)
    return (
        <Grid>
            <Typography
                translateGroup="dashboard"
                translateKey="dashboard"
                weight={600}
                elementType="h5"
                margin="mb-1"
                style={{
                    textTransform: 'capitalize',
                    width: '100%',
                }}
            />

            <Grid hidden={!!currentJackpot}>
                <Typography
                    translateGroup="dashboard"
                    translateKey="select-a-jackpot"
                    weight={400}
                    elementType="p"
                    margin="mb-3"
                    style={{
                        textTransform: 'capitalize',
                    }}
                />
            </Grid>
            <Grid
                onClick={() => setCurrentJackpot(null)}
                hidden={!currentJackpot}
                gap="0.5rem"
                verticalAlgin="center"
                padding={['pb-3']}
                width="fit-content"
                style={{
                    cursor: 'pointer',
                }}
            >
                <IoArrowBackCircleOutline />
                <Typography
                    translateGroup="dashboard"
                    translateKey="back-to-list"
                    weight={400}
                    elementType="p"
                    style={{
                        textTransform: 'capitalize',
                    }}
                />
            </Grid>
        </Grid>
    )
}
