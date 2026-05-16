/* eslint-disable react/no-danger */
import React from 'react'
import Grid from 'components/uiKit/grid'
import { textTranslated } from 'components/TextTranslated'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import Typography from 'components/uiKit/typography'
import { JackpotI } from 'utils/services/api/requests/jackpots/types'
import InfoCard from 'components/cards/infoCard'
import { TiInfoLargeOutline } from 'react-icons/ti'
import { poolsI } from 'utils/services/api/requests/pools'
import Card from 'components/cards/card'
import ExpandCollapseCard from 'components/cards/expandCollapseCard'
import { FormContext } from '../..'
import { CrudContext } from '../../..'
import MultiLevelTierCardInfo from './multiLevelTierCardInfo'

interface A {
    selectedItem: JackpotI
}
export default function SummaryTab() {
    const {
        selectedItem,
    } = React.useContext(CrudContext) as A

    const {
        errors,
        updateField,
        setCurrentInfo,
    } = React.useContext(FormContext)
    return (
        <Grid gap="0.5rem" verticalAlgin="stretch">
            <Grid>
                <Typography
                    translateGroup="summary-tab"
                    translateKey="summary"
                    size="lg"
                    weight={600}
                />
            </Grid>
            <InfoCard
                color="primary-full"
                responsiveWidth={{ sm: 100, md: 'calc(33% - 0.5rem)' }}
                icon={<TiInfoLargeOutline />}
                label="jackpot-info"
                content={(
                    <Grid gap="0.5rem">
                        <Grid>
                            <Typography>
                                {selectedItem.internalName}
                            </Typography>
                        </Grid>
                        <section dangerouslySetInnerHTML={{ __html: selectedItem.internalDescription }} />
                    </Grid>
                )}
            />
            <InfoCard
                color="primary-full"
                responsiveWidth={{ sm: 100, md: 'calc(33% - 0.5rem)' }}
                icon={<TiInfoLargeOutline />}
                label="type"
                content={selectedItem.type}
            />
            <InfoCard
                color="primary-full"
                responsiveWidth={{ sm: 100, md: 'calc(33% - 0.5rem)' }}
                icon={<TiInfoLargeOutline />}
                label="model"
                content={selectedItem.model === 1 ? 'FIXED' : selectedItem.model === 2 ? 'AVERAGE' : 'MAXIMUM'}
            />
            <InfoCard
                hidden={selectedItem.type === 'MULTI_LEVEL'}
                color="primary-full"
                responsiveWidth={{ sm: 100, md: 'calc(33% - 0.5rem)' }}
                icon={<TiInfoLargeOutline />}
                label="player-contribution"
                content={`${selectedItem.pools[0].playerContributionPercent}%`}
            />
            <InfoCard
                hidden={selectedItem.type === 'MULTI_LEVEL'}
                color="primary-full"
                responsiveWidth={{ sm: 100, md: 'calc(33% - 0.5rem)' }}
                icon={<TiInfoLargeOutline />}
                label="operator-contribution"
                content={`${selectedItem.pools[0].operatorContribution}%`}
            />
            <MultiLevelTierCardInfo selectedItem={selectedItem} />
        </Grid>
    )
}
