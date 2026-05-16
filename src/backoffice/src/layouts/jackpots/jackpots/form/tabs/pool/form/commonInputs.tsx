import Grid from 'components/uiKit/grid'
import React, { useContext } from 'react'
import { CrudContext } from 'layouts/jackpots/jackpots'
import BrandContext from 'context/brand'
import { FormContext } from '../../..'
import { usePoolForm } from '../usePool'
import SelectContributionType from '../components/Selector'
import ContributionInputs from '../components/ContributionInputs'
import OperatorContributionInputs from '../components/OperatorContributionInputs'

export default function CommonInputs() {
    const { currentBrand } = useContext(BrandContext)
    const { selectedItem } = useContext(CrudContext)
    const { updatePoolsCommonFields } = usePoolForm()
    const { errors, setCurrentInfo } = useContext(FormContext)

    return (
        <Grid gap="1rem">
            <SelectContributionType
                selectedType={selectedItem?.pools[0].contributionType || 1}
                updatePool={updatePoolsCommonFields as any}
                setCurrentInfo={setCurrentInfo}
                readonly={!!selectedItem?.pools[0]?.id}
                index={0}
            />
            <ContributionInputs
                selectedType={selectedItem?.pools[0].contributionType || 1}
                errors={errors}
                selectedItem={selectedItem}
                updatePool={updatePoolsCommonFields as any}
                setCurrentInfo={setCurrentInfo}
                readOnly={!!selectedItem?.pools[0]?.id}
                index={0}
                isMultiLevel
            />
            {!currentBrand?.operatorOnly && (
                <OperatorContributionInputs
                    pool={selectedItem?.pools[0]}
                    errors={errors}
                    updatePool={updatePoolsCommonFields as any}
                    setCurrentInfo={setCurrentInfo}
                    readOnly={!!selectedItem?.pools[0]?.id}
                />
            )}
        </Grid>
    )
}
