import React from 'react'
import { CrudContext } from '../..'
import Grid from 'components/uiKit/grid'
import DataGridV2 from 'components/uiKit/dataGridV2'


export default function PlayersTab() {
    const {
        selectedItem,
    } = React.useContext(CrudContext)
    return (
        <Grid>
            <DataGridV2
                data={selectedItem.wins || []}
                columns={[
                    {
                        key: 'id',
                        uniqueId: 'id',
                        label: 'id',
                        filter: true,
                    },
                   {
                    key: 'brandPlayerId',
                        label: 'brandPlayerId',
                        uniqueId: 'brandPlayerId',
                        filter: true,
                    },
                ]}
            />
        </Grid>
    )
}
