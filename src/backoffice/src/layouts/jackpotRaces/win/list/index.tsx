import React, { useContext } from 'react'
import { BsPlusCircle } from 'react-icons/bs'
import Typography from 'components/uiKit/typography'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import DataGridV3 from 'components/uiKit/dataGridV3'
import winApi from 'utils/services/api/requests/jackpot-race-api/win'
import { CrudContext } from '..'
import { columns } from './listSettings'

export default function ListCrud() {
    const { refreshState, setSelectedItem, selectedItem } = useContext(CrudContext)
    return (
        <>
            <Grid horizontalAlgin="flex-end" margin="mb-3">
                <Button id="add-item-button" onClick={() => { setSelectedItem(winApi.defaultItem) }} color="primary">
                    <Grid wrap="nowrap" gap="0.25rem" horizontalAlgin="center" verticalAlgin="center">
                        <BsPlusCircle />
                        <Typography
                            translateGroup="jackpot-race-win"
                            translateKey="add"
                            weight={600}
                        />
                    </Grid>
                </Button>
            </Grid>
            <DataGridV3
                onRowClick={(row: any) => setSelectedItem(row)}
                columns={columns}
                dataService={(p) => winApi.getItems(p)}
                dataGridId={`win-${refreshState}`}
                enablePagination
            />
        </>
    )
}
