import Loading from 'assets/loading'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import Typography from 'components/uiKit/typography'
import React, { useState } from 'react'
import { IoSaveOutline } from 'react-icons/io5'
import payoutApi, { payoutI } from 'utils/services/api/requests/raffle-api/payout'

interface Props {
    item: payoutI,
    successCallback: Function,
}

export default function EditAmountCell(props: Props) {
    const { item, successCallback } = props
    const [loading, setLoading] = useState(false)
    const [payout, setPayout] = useState(item)
    function updateField(field: string, value: any) {
        setPayout((current) => ({ ...current, [field]: value }))
    }
    function handleSubmitPayout() {
        payoutApi.submitPayoutForm(payout, {
            successCallBack: () => {
                successCallback()
            }
        })
    }
    return (
        <Grid gap='0.5rem' wrap='nowrap' verticalAlgin='flex-end' width={'fit-content'}>
            <InputGroup
                id="amount"
                name="amount"
                label="payout-amount"
                inputType='number'
                value={payout?.amount}
                onChange={({ target }) => { updateField(target.name, target.value) }}
                styles={{ maxWidth: '180px' }}
            />
            <Button id='crud-button-submit' disabled={loading || !payout.amount} color="primary" onClick={() => handleSubmitPayout()}>
                <Grid wrap="nowrap" gap="0.25rem" horizontalAlgin="center" verticalAlgin="center">
                    <IoSaveOutline />
                    <Typography
                        translateGroup="global"
                        translateKey="save"
                    />
                    {
                        loading && (
                            <Loading size={30} />
                        )
                    }
                </Grid>
            </Button>
        </Grid>
    )
}
