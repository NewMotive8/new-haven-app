import React, { useContext } from 'react'
import { CrudContext } from '../../..'
import AuthContext from 'context/auth'
import { useQuery } from 'react-query'
import ruleApi, { ruleI } from 'utils/services/api/requests/tournament-api/rule'
import Grid from 'components/uiKit/grid'
import DataGridV2 from 'components/uiKit/dataGridV2'
import DialogContext from 'context/dialog'
import RuleForm from './ruleForm'
import Button from 'components/uiKit/buttons'
import { BsPlusCircle, BsTrash } from 'react-icons/bs'
import Typography from 'components/uiKit/typography'
import EditAmountCell from './editAmountCell'

export default function TournamentRules() {
    const { selectedItem } = React.useContext(CrudContext)
    const { isAuthenticated, token } = useContext(AuthContext)
    const { data: allRules, isLoading, refetch: refreshRuleList } = useQuery([`rule-by-tournament-${selectedItem.id}`, token], () => ruleApi.getRulesByTournament(selectedItem.id), {
         enabled: !!isAuthenticated && !!selectedItem.id,
     })
    const { displayDialog, removeDialog } = useContext(DialogContext)

    function handleDisplayAddRuleDialog() {
        displayDialog({
            dialogId: 'RULE-FORM-DIALOG',
            content: (<RuleForm
                tournament={selectedItem}
                close={() => removeDialog('RULE-FORM-DIALOG')}
            />),
            onCloseCallback: () => { refreshRuleList() }
        })
    }

    return (
        <Grid gap={'1rem'} padding={['pt-4']}>
            <Grid horizontalAlgin='flex-end'>
                <Button
                    id='add-item-button'
                    onClick={() => handleDisplayAddRuleDialog()}
                    color='primary'
                >
                    <Grid wrap="nowrap" gap="0.25rem" horizontalAlgin="center" verticalAlgin="center">
                        <BsPlusCircle />
                        <Typography
                            translateGroup="tournament-race-instance"
                            translateKey="add-new-rule"
                            weight={600}
                        />
                    </Grid>
                </Button>
            </Grid>

            <DataGridV2
                data={allRules}
                additionalHeaderInfo={(
                    <Grid gap="0.5rem">
                        <Typography
                            translateGroup="tournament-race-rule"
                            translateKey="total-rule-applied"
                        />
                        <Typography weight={800}>
                            {allRules?.length || 0}
                        </Typography>
                    </Grid>
                )}
                 
                columns={[
                    {
                        key: 'id',
                        uniqueId: 'id',
                        label: 'ruleId',
                        filter: true,
                        style: { maxWidth: '80px' },

                    },
                    {
                        key: 'type',
                        uniqueId: 'type',
                        label: 'ruleType',
                        filter: true,
                        style: { maxWidth: '80px' },
                    },
                    {
                        key: 'amount',
                        uniqueId: 'amount',
                        label: 'Fields',
                        filter: true,
                        render: (value: any, row: ruleI, rowNumber: number) => {
                          
                            return (
                                <Grid wrap='nowrap' gap='0.5rem' horizontalAlgin='flex-start' verticalAlgin='flex-end'>
                                    <EditAmountCell
                                        item={row}
                                        successCallback={() => refreshRuleList()}
                                    />
                                    
                                            <Button
                                                color='danger'
                                                id='delete-rule'
                                                onClick={() => ruleApi.deleteRule({ id: row?.id as number, successCallBack: () => { refreshRuleList() } })}
                                            >
                                                <BsTrash />
                                            </Button>
                                        
                                </Grid>
                            )
                        },
                    },
                ]}
            />
        </Grid>
    )
}
