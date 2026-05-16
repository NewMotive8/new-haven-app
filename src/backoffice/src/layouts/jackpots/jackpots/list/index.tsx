import React, { useContext, useState } from 'react'
import { BsPlusCircle } from 'react-icons/bs'
import Typography from 'components/uiKit/typography'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import DataGridV3 from 'components/uiKit/dataGridV3'
import jackpotsApi from 'utils/services/api/requests/jackpots'
import { jackpotStatus, parseParamsToAddFilterByJackpotStatus } from 'utils/functions/requests/requestParams'
import TabSelector from 'components/selectors/tabSelector'
import { useQuery } from 'react-query'
import AuthContext from 'context/auth'
import userApi, { userRoleType } from 'utils/services/api/requests/user'
import Loading from 'assets/loading'
import { CrudContext } from '..'
import { columns } from './listSettings'

interface filterTabsI {
    label: React.ReactNode,
    value: jackpotStatus
}
const filterTabs: filterTabsI[] = [
    { label: <Typography translateGroup="jackpot-status" translateKey="active" />, value: 'active' },
    { label: <Typography translateGroup="jackpot-status" translateKey="template" />, value: 'template' },
    { label: <Typography translateGroup="jackpot-status" translateKey="disabled" />, value: 'disabled' },
]

export default function ListCrud() {
    const {
 refreshState, askRefresh, setSelectedItem, selectedItem,
} = useContext(CrudContext)
    const [currentStatus, setCurrentStatus] = useState<filterTabsI>(filterTabs[0])
    const { token, isAuthenticated } = React.useContext(AuthContext)
    const { data: userProfile, isLoading, error } = useQuery(['account-info', token], userApi.getUserInfo, {
        enabled: !!isAuthenticated,
    })

    if (isLoading) {
        return <Loading />
    }

    return (
        <>
            <Grid horizontalAlgin="flex-end" margin="mb-3">
                <Button id="add-item-button" onClick={() => { setSelectedItem(jackpotsApi.defaultItem) }} color="primary">
                    <Grid wrap="nowrap" gap="0.25rem" horizontalAlgin="center" verticalAlgin="center">
                        <BsPlusCircle />
                        <Typography
                            translateGroup="jackpots"
                            translateKey="add"
                            weight={600}
                        />
                    </Grid>
                </Button>
            </Grid>
            <Grid>
                <TabSelector
                    currentTab={currentStatus}
                    setCurrentTab={setCurrentStatus as any}
                    tabs={filterTabs}
                    orientation="horizontal"
                />
            </Grid>
            <DataGridV3
                onRowClick={(row: any) => setSelectedItem(row)}
                columns={columns({
                    userRole: userProfile?.role as userRoleType,
                    askRefresh: askRefresh as any,
                    setSelectedItem,
                    addCloneButton: currentStatus.value === 'template',
                })}
                dataService={(p) => jackpotsApi.getItems(parseParamsToAddFilterByJackpotStatus(currentStatus.value, p))}
                dataGridId={`jackpots-${refreshState}-${currentStatus.value}`}
            />
        </>
    )
}
