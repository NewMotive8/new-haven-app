import React, { useEffect } from 'react'
import Grid from 'components/uiKit/grid'
import { textTranslated } from 'components/TextTranslated'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import Toggle from 'components/uiKit/inputs/Toggle'
import EditorGroup from 'components/uiKit/inputs/Editor'
import DialogContext from 'context/dialog'
import CurrencySelector from 'components/selectors/currency'
import confirmBox from 'components/selectors/confirmBox'
import Typography from 'components/uiKit/typography'
import BrandContext from 'context/brand'
import { formatCurrency } from 'utils/functions/numbers'
import Button from 'components/uiKit/buttons'
import InfoCard from 'components/cards/infoCard'
import { FaTrophy, FaWallet } from 'react-icons/fa'
import { FormContext } from '../..'
import { CrudContext } from '../../..'
import TopUpPoolForm from './topUpPoolForm'

export default function BasicTab() {
    const {
        selectedItem,
        setSelectedItem,
    } = React.useContext(CrudContext)
    const {
        errors,
        updateField,
        setCurrentInfo,
        validateTab,
    } = React.useContext(FormContext)
    const { currentBrand } = React.useContext(BrandContext)

    useEffect(() => {
        validateTab('basic')
    }, [
        selectedItem.internalName,
        selectedItem.internalDescription,
        selectedItem.currency,
    ])

    const { displayDialog, removeDialog } = React.useContext(DialogContext)

    function handleChooseCurrency() {
        displayDialog({
            dialogId: 'CURRENCY-SELECTOR',
            content: (<CurrencySelector onChange={(currency) => { updateField('currency', currency.iso3); removeDialog('CURRENCY-SELECTOR') }} />),
        })
    }

    function handleThemeToggleChange(newValue: boolean) {
        confirmBox({
            confirmMessage: (
                <Typography
                    translateGroup="global"
                    translateKey={
                        newValue
                            ? 'are-you-sure-you-want-to-turn-this-active-jackpot-into-a-template?'
                            : 'are-you-sure-you-no-longer-want-to-use-this-jackpot-as-a-template?'
                    }
                    style={{ width: '100%', textAlign: 'center' }}
                />
            ),
            onConfirm: () => {
                updateField('template', newValue)
            },
        })
    }

    function handleTopUpPool(isSeed?: boolean) {
        displayDialog({
            dialogId: 'TOP-UP-FORM',
            content: (<TopUpPoolForm
                isSeed={!!isSeed}
                jackpotId={selectedItem.id}
                setValues={setSelectedItem}
                currency={currentBrand?.currency as string}
            />),
        })
    }
    return (
        <Grid gap="0.5rem">
            <Grid gap="1rem" responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
                <InputGroup
                    id="internalName"
                    name="internalName"
                    label="internalName"
                    feedback={errors?.internalName}
                    status={errors?.internalName && 'error'}
                    value={selectedItem.internalName}
                    onChange={({ target }) => { updateField(target.name, target.value) }}
                    onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-internalName-help', returnDefault: 'nothing' }))}
                />
                <Grid>
                    <EditorGroup
                        id="internalDescription"
                        name="internalDescription"
                        label="internalDescription"
                        status={errors?.internalDescription && 'error'}
                        feedback={errors?.internalDescription}
                        value={selectedItem.internalDescription}
                        onChange={({ target }) => { updateField(target.name, target.value) }}
                        onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-internalDescription-help', returnDefault: 'nothing' }))}
                    />
                </Grid>
            </Grid>
            <Grid gap="1rem" responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
                {/* <InputGroup
                    id="currency"
                    name="currency"
                    label="currency"
                    feedback={errors?.currency}
                    status={errors?.currency && 'error'}
                    value={selectedItem.currency}
                    onChange={({ target }) => { updateField(target.name, target.value) }}
                    onFocus={() => { handleChooseCurrency() }}
                    inputProps={{
                        readOnly: true,
                        onMouseEnter: () => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-jackpot-currency-help', returnDefault: 'nothing' })),
                    }}
                /> */}
                <Grid>
                    <Toggle
                        label="template"
                        name="template"
                        id="template"
                        value={selectedItem.template}
                        onChange={({ target }: any) => { handleThemeToggleChange(!!target.value) }}
                        displayInfo={!!textTranslated({ group: 'forms-tabs-helpers', key: 'input-template-help', returnDefault: 'nothing' })}
                        onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-template-help', returnDefault: 'nothing' }))}
                    />
                </Grid>
                <Grid>
                    {
                        !!selectedItem.id && (
                            <>
                                <InfoCard
                                    label={(
                                        <Typography
                                            translateGroup="basic-jackpot-tab"
                                            translateKey="current-pool-amount"
                                            weight={600}
                                        />
                                    )}
                                    gap="0.5rem"
                                    margin={['mt-3']}
                                    color="primary-full"
                                    icon={<FaWallet />}
                                    content={(
                                        <Grid gap="0.5rem">
                                            <Typography weight={700} size="lg">
                                                {
                                                    formatCurrency(selectedItem?.pools[0]?.currentAmount, currentBrand?.currency as string)
                                                }
                                            </Typography>
                                            <Grid>
                                                <Button id="top-up-pool" onClick={() => handleTopUpPool()} color="primary">
                                                    <Typography
                                                        translateGroup="basic-jackpot-tab"
                                                        translateKey="top-up-pool"
                                                    />
                                                </Button>
                                            </Grid>
                                        </Grid>
                                    )}
                                />
                                <InfoCard
                                    label={(
                                        <Typography
                                            translateGroup="basic-jackpot-tab"
                                            translateKey="current-pool-wins"
                                            weight={600}
                                        />
                                    )}
                                    gap="0.5rem"
                                    margin={['mt-3']}
                                    color="primary-full"
                                    icon={<FaTrophy />}
                                    content={(
                                        <Grid gap="0.5rem">
                                            <Typography weight={700} size="lg">
                                                {
                                                    (`${selectedItem?.pools[0]?.numberOfWins || 0}`)
                                                }
                                            </Typography>
                                        </Grid>
                                    )}
                                />
                                <InfoCard
                                    label={(
                                        <Typography
                                            translateGroup="basic-jackpot-tab"
                                            translateKey="current-seed-amount"
                                            weight={600}
                                        />
                                    )}
                                    gap="0.5rem"
                                    margin={['mt-3']}
                                    color="primary-full"
                                    icon={<FaWallet />}
                                    content={(
                                        <Grid gap="0.5rem">
                                            <Typography weight={700} size="lg">
                                                {
                                                    formatCurrency(selectedItem?.seeds[0]?.currentAmount, currentBrand?.currency as string)
                                                }
                                            </Typography>
                                            <Grid>
                                                <Button id="top-up-seed" onClick={() => handleTopUpPool(true)} color="primary">
                                                    <Typography
                                                        translateGroup="basic-jackpot-tab"
                                                        translateKey="top-up-seed"
                                                    />
                                                </Button>
                                            </Grid>
                                        </Grid>
                                    )}
                                />

                            </>
                        )
                    }
                </Grid>
            </Grid>
        </Grid>
    )
}
