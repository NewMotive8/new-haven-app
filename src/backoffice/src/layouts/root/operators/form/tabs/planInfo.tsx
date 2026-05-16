import React from 'react'
import Grid from 'components/uiKit/grid'
import { textTranslated } from 'components/TextTranslated'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import InfoCard from 'components/cards/infoCard'
import { BsCurrencyDollar } from 'react-icons/bs'
import Typography from 'components/uiKit/typography'
import { FormContext } from '..'
import { CrudContext } from '../..'

export default function PlanInfoTab() {
    const {
        selectedItem,
    } = React.useContext(CrudContext)
    const {
        errors,
        updateField,
        setCurrentInfo,
    } = React.useContext(FormContext)
    return (
        <Grid gap="0.5rem">
            <InfoCard
            color="secondary"
                label="Plan Information"
                icon={<BsCurrencyDollar />}
                content={(
                    <Grid wrap="nowrap">
                        <Grid>
                            <Typography
                                translateGroup="operator-plan-details"
                                translateKey="name"
                                weight={600}
                                style={{ width: '100%' }}
                            />
                            <Typography>
                                {selectedItem?.tier?.name}
                            </Typography>
                        </Grid>
                        <Grid>
                            <Typography
                                translateGroup="operator-plan-details"
                                translateKey="current-events"
                                weight={600}
                                style={{ width: '100%' }}
                            />
                            <Typography>
                                {`${selectedItem?.plan?.currentEvents || 0}`}
                            </Typography>
                        </Grid>
                        <Grid>
                            <Typography
                                translateGroup="operator-plan-details"
                                translateKey="level"
                                weight={600}
                                style={{ width: '100%' }}
                            />
                            <Typography>
                                {selectedItem?.tier?.level}
                            </Typography>
                        </Grid>
                        <Grid>
                            <Typography
                                translateGroup="operator-plan-details"
                                translateKey="maximum-events"
                                weight={600}
                                style={{ width: '100%' }}
                            />
                            <Typography>
                                {selectedItem?.tier?.maximumEvents}
                            </Typography>
                        </Grid>
                    </Grid>
                )}
            />
        </Grid>
    )
}
