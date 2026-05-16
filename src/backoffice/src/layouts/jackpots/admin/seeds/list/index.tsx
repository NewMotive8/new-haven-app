import React, { useContext } from 'react'
import { BsPlusCircle } from 'react-icons/bs'
import Typography from 'components/uiKit/typography'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import DataGridV3 from 'components/uiKit/dataGridV3'
import seedsApi from 'utils/services/api/requests/seeds'
import { CrudContext } from '..'
import { columns } from './listSettings'

export default function ListCrud() {
    const { refreshState, setSelectedItem, selectedItem } = useContext(CrudContext)
    return (
        <>

            <DataGridV3
                onRowClick={(row: any) => setSelectedItem(row)}
                columns={columns}
                dataService={(p) => seedsApi.getItems(p)}
                dataGridId={`seeds-${refreshState}`}
            />
        </>
    )
}
