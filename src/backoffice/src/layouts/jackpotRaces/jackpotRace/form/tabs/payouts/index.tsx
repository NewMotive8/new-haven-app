import React, { useContext } from 'react'
import { CrudContext } from '../../..'
import AuthContext from 'context/auth'
import { useQuery } from 'react-query'
import payoutApi, { payoutI } from 'utils/services/api/requests/jackpot-race-api/payout'
import Grid from 'components/uiKit/grid'
import DataGridV2 from 'components/uiKit/dataGridV2'
import DialogContext from 'context/dialog'
import PayoutForm from './payoutForm'
import Button from 'components/uiKit/buttons'
import { BsPlusCircle, BsTrash } from 'react-icons/bs'
import Typography from 'components/uiKit/typography'
import EditAmountCell from './editAmountCell'

export default function RacePayouts() {
    const { selectedItem } = React.useContext(CrudContext)
    const { isAuthenticated, token } = useContext(AuthContext)
    const { data: allPayouts, isLoading, refetch: refreshPayoutList } = useQuery([`payout-by-race-${selectedItem.id}`, token], () => payoutApi.getPayoutByRace(selectedItem.id), {
        enabled: !!isAuthenticated && !!selectedItem.id,
    })
    const { displayDialog, removeDialog } = useContext(DialogContext)

    function findHightestPlace() {
        let highestPlace = 0
        allPayouts.forEach((payout: payoutI) => {
            if (payout.endPlace > highestPlace) {
                highestPlace = payout.endPlace
            }
        })
        return highestPlace
    }

    function handleDisplayAddPayoutDialog() {
        displayDialog({
            dialogId: 'PAYOUT-FORM-DIALOG',
            content: (<PayoutForm
                spinSprint={selectedItem}
                close={() => removeDialog('PAYOUT-FORM-DIALOG')}
                currentPlace={findHightestPlace()}
            />),
            onCloseCallback: () => { refreshPayoutList() }
        })
    }

    function sumTotalPayout(){
        let total = 0;
        (allPayouts || []).forEach((payout: payoutI) => {
            const places = (payout.endPlace - payout.startPlace) + 1
            total += payout.amount * places
        })
        return total
    }


    return (
        <Grid gap={'1rem'} padding={['pt-4']}>
            <Grid horizontalAlgin='flex-end'>
                <Button
                    id='add-item-button'
                    onClick={() => handleDisplayAddPayoutDialog()}
                    color='primary'
                >
                    <Grid wrap="nowrap" gap="0.25rem" horizontalAlgin="center" verticalAlgin="center">
                        <BsPlusCircle />
                        <Typography
                            translateGroup="jackpot-race-instance"
                            translateKey="add-new-payout"
                            weight={600}
                        />
                    </Grid>
                </Button>
            </Grid>

            <DataGridV2
                data={allPayouts}
                additionalHeaderInfo={(
                    <Grid gap="0.5rem">
                        <Typography
                            translateGroup="jackpot-race-payout"
                            translateKey="total-payout-paid"
                        />
                        <Typography weight={800}>
                            {sumTotalPayout().toFixed(2)}
                        </Typography>
                    </Grid>
                )}
                columns={[
                    {
                        key: 'startPlace',
                        uniqueId: 'startPlace',
                        label: 'Start place',
                        filter: true,
                        style: { maxWidth: '80px' },

                    },
                    {
                        key: 'endPlace',
                        uniqueId: 'endPlace',
                        label: 'End place',
                        filter: true,
                        style: { maxWidth: '80px' },
                    },
                    {
                        key: 'amount',
                        uniqueId: 'amount',
                        label: 'Amount',
                        filter: true,
                        render: (value: any, row: payoutI, rowNumber: number) => {
                            const isLastOne = rowNumber === allPayouts.length - 1
                            return (
                                <Grid wrap='nowrap' gap='0.5rem' horizontalAlgin='flex-start' verticalAlgin='flex-end'>
                                    <EditAmountCell
                                        item={row}
                                        successCallback={() => refreshPayoutList()}
                                    />
                                    {
                                        isLastOne && (
                                            <Button
                                                color='danger'
                                                id='delete-payout'
                                                onClick={() => payoutApi.deletePayout({ id: row?.id as number, successCallBack: () => { refreshPayoutList() } })}
                                            >
                                                <BsTrash />
                                            </Button>
                                        )
                                    }
                                </Grid>
                            )
                        },
                    },
                ]}
            />
        </Grid>
    )
}
