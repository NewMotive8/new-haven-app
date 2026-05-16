import React, { useContext } from 'react'
import { BsPlusCircle } from 'react-icons/bs'
import Typography from 'components/uiKit/typography'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import DataGridV3 from 'components/uiKit/dataGridV3'
import tournamentRaceApi from 'utils/services/api/requests/tournament-api/tournamentRace'
import { CrudContext } from '..'
import { columns } from './listSettings'
import BrandContext from 'context/brand'
import tournamentsApi from 'utils/services/api/requests/tournaments'

export default function ListCrud() {
    const { refreshState, setSelectedItem, selectedItem } = useContext(CrudContext)
    const {
        brandId,
    } = useContext(BrandContext)
    return (
        <>
            {/* Add button to add tournament race */}
            <Grid horizontalAlgin="flex-end" margin="mb-3">
                <Button id="add-item-button" onClick={() => { setSelectedItem({ ...tournamentsApi.defaultItem, brandId }) }} color="primary">
                    <Grid wrap="nowrap" gap="0.25rem" horizontalAlgin="center" verticalAlgin="center">
                        <BsPlusCircle />
                        <Typography
                            translateGroup="tournament-race"
                            translateKey="add"
                            weight={600}
                        />
                    </Grid>
                </Button>
            </Grid>
            {/* List of tournament races */}
            <DataGridV3
                onRowClick={(row: any) => setSelectedItem(row)}
                columns={columns}
                dataService={(p) => tournamentRaceApi.getItems(p)}
                dataGridId={`tournamentRace-${refreshState}`}
                enablePagination
            />
        </>
    )
}
