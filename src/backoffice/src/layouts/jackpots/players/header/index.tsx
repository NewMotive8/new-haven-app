import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import React, { useContext } from 'react'
import { IoArrowBackCircleOutline } from 'react-icons/io5'
import { CrudContext } from '..'

export default function PlayersHeader() {
    const { selectedItem, setSelectedItem } = useContext(CrudContext)

    return (
        <Grid>
            <Grid
                onClick={() => setSelectedItem(null)}
                hidden={!selectedItem}
                gap="0.5rem"
                verticalAlgin="center"
                padding={['pb-3']}
                width="fit-content"
                style={{
                    cursor: 'pointer',
                }}
            >
                <IoArrowBackCircleOutline size={25} />
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
            <Typography
                translateGroup="players"
                translateKey="players"
                weight={600}
                elementType="h5"
                margin="mb-1"
                style={{
                    textTransform: 'capitalize',
                    width: '100%',
                }}
            />

            <Typography
                translateGroup="players"
                translateKey="players-administration"
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
