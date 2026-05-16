import Grid from 'components/uiKit/grid'
import React, { useContext } from 'react'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import { CrudContext } from 'layouts/jackpots/jackpots'
import BrandContext from 'context/brand'
import { textTranslated } from 'components/TextTranslated'
import { FormContext } from '../../..'
import { usePoolForm } from '../usePool'
import { Weighting } from './Weighting'

interface MLInputsI {
    index: number
}

export default function MultiLevelInputs({ index }: MLInputsI) {
    const { selectedItem } = useContext(CrudContext)
    const { model } = selectedItem
    const { updatePool } = usePoolForm()
    const { errors, setCurrentInfo } = useContext(FormContext)

    const currentPool = selectedItem?.pools[index]
    return (
        <Grid gap="1rem">
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)' }}>
                {
                    model === 2
                        ? (

                            <InputGroup
                                inputType="number"
                                id="averageWinAmount"
                                name="averageWinAmount"
                                label="averageWinAmount"
                                feedback={errors?.averageWinAmount}
                                status={errors?.averageWinAmount && 'error'}
                                value={currentPool.averageWinAmount}
                                onChange={({ target }) => {
                                    updatePool(target.name, target.value, index)
                                }}
                                onFocus={() => setCurrentInfo(
                                    textTranslated({
                                        group: 'forms-tabs-helpers',
                                        key: 'input-averageWinAmount-help',
                                        returnDefault: 'nothing',
                                    }),
                                )}
                                inputProps={{ readOnly: !!selectedItem.id }}
                            />
                        )
                        : model === 3
                            ? (
                                <InputGroup
                                    inputType="number"
                                    id="maximumWinAmount"
                                    name="maximumWinAmount"
                                    label="maximumWinAmount"
                                    feedback={errors?.maximumWinAmount}
                                    status={errors?.maximumWinAmount && 'error'}
                                    value={currentPool.maximumWinAmount}
                                    onChange={({ target }) => {
                                        updatePool(target.name, target.value, index)
                                    }}
                                    onFocus={() => setCurrentInfo(
                                        textTranslated({
                                            group: 'forms-tabs-helpers',
                                            key: 'input-maximumWinAmount-help',
                                            returnDefault: 'nothing',
                                        }),
                                    )}
                                    inputProps={{ readOnly: !!selectedItem.id }}
                                />
                            )
                            : <></>
                }
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)' }}>
                <Weighting
                    pool={selectedItem.pools[index]}
                    errors={errors}
                    updatePool={updatePool}
                    index={index}
                    setCurrentInfo={setCurrentInfo}
                    readOnly={!!selectedItem.pools[index]?.id}
                />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)' }}>
                <InputGroup
                    inputType="number"
                    id="currentAmount"
                    name="currentAmount"
                    label="initial-jackpot-amount"
                    feedback={errors?.currentAmount}
                    status={errors?.currentAmount && 'error'}
                    value={selectedItem?.pools[index]?.currentAmount || 0}
                    onChange={({ target }) => {
                        updatePool(target.name, target.value)
                    }}
                    onFocus={() => setCurrentInfo(
                        textTranslated({
                            group: 'forms-tabs-helpers',
                            key: 'input-currentAmount-help',
                            returnDefault: 'nothing',
                        }),
                    )}
                    inputProps={{ readOnly: !!selectedItem?.pools[index]?.id }}
                />
            </Grid>
        </Grid>
    )
}
