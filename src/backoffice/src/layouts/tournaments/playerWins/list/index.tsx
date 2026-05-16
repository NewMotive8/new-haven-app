import React, { useContext } from 'react'
import DataGridV3 from 'components/uiKit/dataGridV3'
import playerWinsApi from 'utils/services/api/requests/tournament-api/playerWins'
import { CrudContext } from '..'
import { columns } from './listSettings'

export default function ListCrud() {
    const { refreshState, setSelectedItem, selectedItem } = useContext(CrudContext)
    return (
        <>
            <DataGridV3
                onRowClick={(row: any) => setSelectedItem(row)}
                columns={columns}
                dataService={(p) => playerWinsApi.getItems(p)}
                dataGridId={`playerWins-${refreshState}`}
                enablePagination
            />
        </>
    )
}
