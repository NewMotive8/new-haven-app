import Grid from 'components/uiKit/grid'
import React, { useContext } from 'react'
import { CrudContext } from 'layouts/jackpots/jackpots'
import BrandContext from 'context/brand'
import { FormContext } from '../../..'
import SelectContributionType from '../components/Selector'
import ContributionInputs from '../components/ContributionInputs'
import OperatorContributionInputs from '../components/OperatorContributionInputs'
import { useSeedForm } from '../useSeed'

export default function CommonInputs() {
    const { currentBrand } = useContext(BrandContext)
    const { selectedItem } = useContext(CrudContext)
    const { updateSeedsCommonFields } = useSeedForm()
    const { errors, setCurrentInfo } = useContext(FormContext)

    return (
        <Grid gap="1rem">
            <SelectContributionType
                selectedType={selectedItem?.seeds[0].type || 1}
                updateSeed={updateSeedsCommonFields as any}
                setCurrentInfo={setCurrentInfo}
                readonly={!!selectedItem?.seeds[0]?.id}
                index={0}
            />
            <ContributionInputs
                selectedType={selectedItem?.seeds[0].type || 1}
                errors={errors}
                selectedItem={selectedItem}
                updateSeed={updateSeedsCommonFields as any}
                setCurrentInfo={setCurrentInfo}
                readOnly={!!selectedItem?.seeds[0]?.id}
                index={0}
                isMultiLevel
            />
            {!currentBrand?.operatorOnly && (
                <OperatorContributionInputs
                    seed={selectedItem?.seeds[0]}
                    errors={errors}
                    updateSeed={updateSeedsCommonFields as any}
                    setCurrentInfo={setCurrentInfo}
                    readOnly={!!selectedItem?.seeds[0]?.id}
                />
            )}
        </Grid>
    )
}
