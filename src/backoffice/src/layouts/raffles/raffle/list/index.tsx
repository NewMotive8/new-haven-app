import React, { useContext } from 'react'
import { BsPlusCircle } from 'react-icons/bs'
import Typography from 'components/uiKit/typography'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import DataGridV3 from 'components/uiKit/dataGridV3'
import raffleApi from 'utils/services/api/requests/raffle-api/raffle'
import { CrudContext } from '..'
import { columns } from './listSettings'
import BrandContext from 'context/brand'

export default function ListCrud() {
    const { refreshState, setSelectedItem } = useContext(CrudContext)
    const {
        brandId,
    } = useContext(BrandContext)
    return (
        <>
            {/* Add button to add raffle */}
            <Grid horizontalAlgin="flex-end" margin="mb-3">
                <Button id="add-item-button" onClick={() => { setSelectedItem({ ...raffleApi.defaultItem, brandId }) }} color="primary">
                    <Grid wrap="nowrap" gap="0.25rem" horizontalAlgin="center" verticalAlgin="center">
                        <BsPlusCircle />
                        <Typography
                            translateGroup="raffle"
                            translateKey="add"
                            weight={600}
                        />
                    </Grid>
                </Button>
            </Grid>
            {/* List of raffles */}
            <DataGridV3
                onRowClick={(row: any) => setSelectedItem(row)}
                columns={columns}
                dataService={(p) => raffleApi.getItems(p)}
                dataGridId={`raffle-${refreshState}`}
                enablePagination
            />
        </>
    )
}
