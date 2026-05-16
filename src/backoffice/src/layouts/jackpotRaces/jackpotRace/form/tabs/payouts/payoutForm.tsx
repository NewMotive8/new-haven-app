import Loading from 'assets/loading'
import Card from 'components/cards/card'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import Typography from 'components/uiKit/typography'
import React, { useState } from 'react'
import { BsXLg } from 'react-icons/bs'
import { IoSaveOutline } from 'react-icons/io5'
import { jackpotRaceI } from 'utils/services/api/requests/jackpot-race-api/jackpotRace'
import payoutApi, { payoutI } from 'utils/services/api/requests/jackpot-race-api/payout'

interface Props {
    currentPlace: number,
    spinSprint: jackpotRaceI,
    close: Function,
}

export default function PayoutForm(props: Props) {
    const { currentPlace, spinSprint, close } = props
    const [loading, setLoading] = useState(false)
    const [payout, setPayout] = useState<payoutI>({
        spinSprint,
        startPlace: currentPlace + 1,
        endPlace: currentPlace + 1,
        amount: 0,
    })

    function updateField(field: string, value: any) {
        setPayout((current) => ({ ...current, [field]: value }))
    }

    function handleSubmitPayout() {
        payoutApi.submitPayoutForm(payout, {
            successCallBack: () => {
                close()
            }
        })
    }


    return (
        <Card color='root' gap={'1rem'}>
            <Grid>
                <Typography
                    translateGroup="jr-payout-form"
                    translateKey="manage-payout"
                    weight={600}
                    size='lg'
                    algin='center'
                />
            </Grid>
            <Grid gap={'1rem'}>
                <Grid responsiveWidth={{ sm: 100, md: 'calc(33.33% - (2 / 3)rem)' }}>
                    <InputGroup
                        id="startPlace"
                        name="startPlace"
                        label="payout-start-place"
                        inputType='number'
                        readOnly
                        value={payout?.startPlace}
                        onChange={({ target }) => { updateField('startPlace', target.value) }}
                        styles={{ opacity: 0.75 }}
                    />
                </Grid>
                <Grid responsiveWidth={{ sm: 100, md: 'calc(33.33% - (2 / 3)rem)' }}>
                    <InputGroup
                        id="endPlace"
                        name="endPlace"
                        label="payout-end-place"
                        inputType='number'
                        value={payout?.endPlace}
                        onChange={({ target }) => { updateField('endPlace', target.value) }}
                    />
                </Grid>
                <Grid responsiveWidth={{ sm: 100, md: 'calc(33.33% - (2 / 3)rem)' }}>
                    <InputGroup
                        id="amount"
                        name="amount"
                        label="payout-amount"
                        inputType='number'
                        value={payout?.amount}
                        onChange={({ target }) => { updateField('amount', target.value) }}
                    />
                </Grid>
            </Grid>
            <Grid wrap="nowrap" margin={['mt-5', 'mb-3']} horizontalAlgin="space-between">
                <Button
                    id='crud-cancelButton'
                    onClick={() => close()}
                    type="button"
                    color="primary-outline"
                >
                    <Grid wrap="nowrap" gap="0.25rem" horizontalAlgin="center" verticalAlgin="center">
                        <BsXLg />
                        <Typography
                            translateGroup="global"
                            translateKey="cancel"
                        />
                    </Grid>
                </Button>
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
        </Card>
    )
}
