import React, { useContext } from 'react'
import { BsPlusCircle } from 'react-icons/bs'
import Typography from 'components/uiKit/typography'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import DataGridV3 from 'components/uiKit/dataGridV3'
import jackpotRaceApi from 'utils/services/api/requests/jackpot-race-api/jackpotRace'
import { CrudContext } from '..'
import { columns } from './listSettings'
import BrandContext from 'context/brand'
import jackpotsApi from 'utils/services/api/requests/jackpots'

export default function ListCrud() {
    const { refreshState, setSelectedItem, selectedItem } = useContext(CrudContext)
    const {
        brandId,
    } = useContext(BrandContext)
    return (
        <>
            {/* Add button to add jackpot race */}
            <Grid horizontalAlgin="flex-end" margin="mb-3">
                <Button id="add-item-button" onClick={() => { setSelectedItem({ ...jackpotsApi.defaultItem, brandId }) }} color="primary">
                    <Grid wrap="nowrap" gap="0.25rem" horizontalAlgin="center" verticalAlgin="center">
                        <BsPlusCircle />
                        <Typography
                            translateGroup="jackpot-race"
                            translateKey="add"
                            weight={600}
                        />
                    </Grid>
                </Button>
            </Grid>
            {/* List of jackpot races */}
            <DataGridV3
                onRowClick={(row: any) => setSelectedItem(row)}
                columns={columns}
                dataService={(p) => jackpotRaceApi.getItems(p)}
                dataGridId={`jackpotRace-${refreshState}`}
                enablePagination
            />
        </>
    )
}
