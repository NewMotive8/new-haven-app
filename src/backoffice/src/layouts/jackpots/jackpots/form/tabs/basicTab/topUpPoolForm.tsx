import React, { useContext } from 'react'
import DialogContext from 'context/dialog'
import InfoHover from 'components/uiKit/InfoHover'
import Typography from 'components/uiKit/typography'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import Grid from 'components/uiKit/grid'
import Card from 'components/cards/card'
import Button from 'components/uiKit/buttons'
import confirmBox from 'components/selectors/confirmBox'
import { api } from 'utils/services/api'
import { toast } from 'react-toastify'
import { formatCurrency } from 'utils/functions/numbers'
import urls from 'utils/services/api/urls'

interface Props {
    jackpotId: string | number,
    setValues: Function,
    currency: string,
    isSeed: boolean,
}

export default function TopUpPoolForm(props: Props) {
    const {
        jackpotId, setValues, currency, isSeed,
    } = props
    const [value, setValue] = React.useState(0)

    const { removeDialog } = useContext(DialogContext)

    function handleDisplayDialog() {
        confirmBox({
            confirmMessage: (
                <Grid gap="1rem">
                    <Grid>
                        <Typography
                            translateGroup="global"
                            translateKey="are-you-sure?"
                            style={{ width: '100%', textAlign: 'center' }}
                        />
                    </Grid>
                    <Grid>
                        <Typography
                            translateGroup="global"
                            translateKey={`the-amount-bellow-will-be-added-to-your-${isSeed ? 'seed' : 'pool'}`}
                            style={{ width: '100%', textAlign: 'center' }}
                        />
                    </Grid>
                    <Grid>
                        <Typography
                            style={{ width: '100%', textAlign: 'center' }}
                        >
                            {formatCurrency(value, currency)}
                        </Typography>
                    </Grid>
                </Grid>
            ),
            onConfirm: () => {
                api.post(urls.jackpots.topUp, {
                    jackpotId,
                    amount: value,
                    isSeed,
                }).then((res) => {
                    toast.success(`successfully added to the ${isSeed ? 'seed' : 'pool'}`)
                    removeDialog('CONFIRM-TOP-UP-FORM')
                    setValues((current: any) => {
                        if (isSeed) {
                            const newSeeds = [...current.seeds]
                            newSeeds[0].currentAmount = parseFloat(`${newSeeds[0]?.currentAmount || 0}`) + parseFloat(`${value || 0}`)
                            return (
                                {
                                    ...current,
                                    seeds: newSeeds,
                                }
                            )
                        }
                        const newPools = [...current.pools]
                        newPools[0].currentAmount = parseFloat(`${newPools[0]?.currentAmount || 0}`) + parseFloat(`${value || 0}`)
                        return (
                            {
                                ...current,
                                pools: newPools,
                            }
                        )
                    })
                }).catch((err) => {
                    toast.error('Something went wrong')
                })
            },
        })
        removeDialog('TOP-UP-FORM')
    }

    return (
        <Card
            color="secondary"
            padding={['p-3', 'pt-5']}
            style={{
                width: '400px',
                maxWidth: 'calc(100vw - 2rem)',
                maxHeight: 'calc(100dvh - 4rem)',
                overflowY: 'auto',

            }}
            animateOnScroll
            animation="zoom-in"
            animationDuration="100ms"
            gap="1rem"
        >
            <Grid horizontalAlgin="center">
                <Typography
                    translateGroup="jackpot-top-up-form"
                    translateKey={`jackpot-${isSeed ? 'seed' : 'pool'}-top-up`}
                    size="md"
                    weight={600}
                    style={{ width: '100%', textAlign: 'center' }}
                />
            </Grid>
            <Grid className="col-12 pb-3 pt-3">
                <InfoHover
                    content={(
                        <Typography
                            translateGroup="jackpot-top-up-form"
                            translateKey={`This amount will be added to the ${isSeed ? 'seed' : 'pool'} currently balance`}
                        />
                    )}
                />
                <InputGroup
                    id="amount"
                    name="amount"
                    label="amount"
                    value={value}
                    onChange={({ target }: any) => setValue(target.value)}
                />

            </Grid>
            <Grid horizontalAlgin="space-between">
                <Button
                    id="cancelButton"
                    color="primary-outline"
                    onClick={() => removeDialog('TOP-UP-FORM')}
                >
                    <Typography
                        translateGroup="global"
                        translateKey="cancel"
                    />
                </Button>
                <Button
                    id="confirmButton"
                    color="primary-outline"
                    onClick={() => handleDisplayDialog()}
                >
                    <Typography
                        translateGroup="global"
                        translateKey="proceed"
                    />
                </Button>
            </Grid>
        </Card>
    )
}
