import React, { useContext } from 'react'
import Grid from 'components/uiKit/grid'
import { textTranslated } from 'components/TextTranslated'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import InfoCard from 'components/cards/infoCard'
import { useThemeWatcher } from 'utils/customHooks'
import {
    BsCalendar, BsCoin, BsPerson, BsToggles,
} from 'react-icons/bs'
import { winsV2I } from 'utils/services/api/requests/winsV2'
import { formatCurrency } from 'utils/functions/numbers'
import BrandContext from 'context/brand'
import { GiGoldBar } from 'react-icons/gi'
import Typography from 'components/uiKit/typography'
import moment from 'moment'
import { FormContext } from '..'
import { CrudContext } from '../..'

interface thisContext {
    selectedItem: winsV2I
}

export default function BasicTab() {
    const {
        selectedItem,
    } = React.useContext(CrudContext) as thisContext
    const {
        errors,
        updateField,
        setCurrentInfo,
    } = React.useContext(FormContext)
    const { currentBrand } = useContext(BrandContext)

    const theme = useThemeWatcher()
    const cardColor = theme === 'light' ? 'primary' : 'primary-full'
    return (
        <Grid gap="1rem" verticalAlgin="stretch">
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)', xxl: 'calc(100% / 4 - (3rem / 4))' }} style={{ minWidth: '230px' }}>
                <InfoCard
                    color={cardColor}
                    label="wins-v2-player-id"
                    icon={<BsPerson />}
                    content={selectedItem?.player?.brandPlayerId}
                    height="100%"
                />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)', xxl: 'calc(100% / 4 - (3rem / 4))' }} style={{ minWidth: '230px' }}>
                <InfoCard
                    color={cardColor}
                    label="wins-v2-amount-won"
                    icon={<BsCoin />}
                    content={formatCurrency(selectedItem?.amountWon, currentBrand?.currency || 'usd')}
                    height="100%"
                />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)', xxl: 'calc(100% / 4 - (3rem / 4))' }} style={{ minWidth: '230px' }}>
                <InfoCard
                    color={cardColor}
                    label="wins-v2-jackpot-internal-name"
                    icon={<GiGoldBar />}
                    content={selectedItem?.jackpot?.internalName}
                    height="100%"
                />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)', xxl: 'calc(100% / 4 - (3rem / 4))' }} style={{ minWidth: '230px' }}>
                <InfoCard
                    color={cardColor}
                    label="wins-v2-jackpot-external-id"
                    icon={<GiGoldBar />}
                    content={selectedItem?.jackpot?.externalId}
                    height="100%"
                />
            </Grid>
            <Grid hidden={!selectedItem?.approvedTime} responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)', xxl: 'calc(100% / 4 - (3rem / 4))' }} style={{ minWidth: '230px' }}>
                <InfoCard
                    color={cardColor}
                    label="wins-v2-approved-time"
                    icon={<BsCalendar />}
                    content={moment(selectedItem?.approvedTime).format('DD/MM/YYYY HH:mm:ss')}
                    height="100%"
                />
            </Grid>
            <Grid hidden={!selectedItem?.deniedTime} responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)', xxl: 'calc(100% / 4 - (3rem / 4))' }} style={{ minWidth: '230px' }}>
                <InfoCard
                    color={cardColor}
                    label="wins-v2-denied-time"
                    icon={<BsCalendar />}
                    content={moment(selectedItem?.deniedTime).format('DD/MM/YYYY HH:mm:ss')}
                    height="100%"
                />
            </Grid>
            <Grid hidden={!selectedItem?.winningTime} responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)', xxl: 'calc(100% / 4 - (3rem / 4))' }} style={{ minWidth: '230px' }}>
                <InfoCard
                    color={cardColor}
                    label="wins-v2-winning-time"
                    icon={<BsCalendar />}
                    content={moment(selectedItem?.winningTime).format('DD/MM/YYYY HH:mm:ss')}
                    height="100%"
                />
            </Grid>
            <Grid hidden={!currentBrand?.hasWithdrawApproval} responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)', xxl: 'calc(100% / 4 - (3rem / 4))' }} style={{ minWidth: '230px' }}>
                <InfoCard
                    color={cardColor}
                    label="wins-v2-status"
                    icon={<BsToggles />}
                    content={(
                        selectedItem.approved
                            ? (
                                <Typography color="var(--success)" translateGroup="wins-v2" translateKey="approved" />
                            )
                            : selectedItem.deniedTime
                                ? (
                                    <Typography color="var(--danger)" translateGroup="wins-v2" translateKey="denied" />
                                )
                                : <Typography color="var(--warn)" translateGroup="wins-v2" translateKey="waiting-aprove-or-deny" />
                    )}
                    height="100%"
                />
            </Grid>
            <Grid hidden={!selectedItem.currentPoolAmount} responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)', xxl: 'calc(100% / 4 - (3rem / 4))' }} style={{ minWidth: '230px' }}>
                <InfoCard
                    color={cardColor}
                    label="current-pool-amount"
                    icon={<></>}
                    content={formatCurrency(selectedItem?.currentPoolAmount || 0, currentBrand?.currency || 'usd')}
                    height="100%"
                />
            </Grid>
            <Grid hidden={!selectedItem.currentSeedAmount} responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)', xxl: 'calc(100% / 4 - (3rem / 4))' }} style={{ minWidth: '230px' }}>
                <InfoCard
                    color={cardColor}
                    label="current-seed-amount"
                    icon={<></>}
                    content={formatCurrency(selectedItem?.currentSeedAmount || 0, currentBrand?.currency || 'usd')}
                    height="100%"
                />
            </Grid>
            <Grid hidden={!selectedItem.isCommunity} responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)', xxl: 'calc(100% / 4 - (3rem / 4))' }} style={{ minWidth: '230px' }}>
                <InfoCard
                    color={cardColor}
                    label="communiy-size"
                    icon={<></>}
                    content={selectedItem?.communitySize}
                    height="100%"
                />
            </Grid>
            <Grid hidden={!selectedItem?.isCommunity} responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)', xxl: 'calc(100% / 4 - (3rem / 4))' }} style={{ minWidth: '230px' }}>
                <InfoCard
                    color={cardColor}
                    label="communiy-member-pay"
                    icon={<></>}
                    content={formatCurrency(selectedItem?.communityMemberPayOut || 0, currentBrand?.currency || 'usd')}
                    height="100%"
                />
            </Grid>
        </Grid>
    )
}
