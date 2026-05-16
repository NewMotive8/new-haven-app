import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import React, { useContext } from 'react'
import { BsArrowLeftCircle } from 'react-icons/bs'
import { CrudContext } from '..'

export default function TournamentRaceCrudHeader() {
    const {
        selectedItem,
        setSelectedItem,
    } = useContext(CrudContext)
    return (
        <Grid wrap='nowrap' gap='0.5rem' verticalAlgin='center' padding={['pb-3']}>
            <Grid hidden={!selectedItem} width={'25px'}>
                <BsArrowLeftCircle size={25} onClick={() => setSelectedItem(null)} />
            </Grid>
            <Grid>
                <Typography
                    weight={600}
                    elementType="h5"
                    margin="mb-1"
                    style={{
                        textTransform: 'capitalize',
                        width: '100%',
                    }}
                >
                    Tournament Setup
                </Typography>

                <Typography
                    weight={400}
                    elementType="p"
                    style={{
                        textTransform: 'capitalize',
                    }}
                >
                    Tournament Administration
                </Typography>
            </Grid>
        </Grid>
    )
}
