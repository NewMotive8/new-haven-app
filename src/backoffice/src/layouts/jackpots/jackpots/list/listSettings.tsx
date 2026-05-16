import Button from 'components/uiKit/buttons'
import { dataGridColumnType } from 'components/uiKit/dataGridV3'
import Typography from 'components/uiKit/typography'
import { userRoleType } from 'utils/services/api/requests/user'
import { jackpotsI } from 'utils/services/api/requests/jackpots'
import Grid from 'components/uiKit/grid'
import poolsApi from 'utils/services/api/requests/pools'
import seedsApi from 'utils/services/api/requests/seeds'
import {
    submitApproval,
    approve,
    reject,
    enable,
    disable,
    deleteJp,
} from './confirmBoxes'

function returnButtons(jackpot: jackpotsI, userRole: userRoleType, askRefresh: Function) {
    const { currentState: csOld, currentStatus } = jackpot.states.sort((a: any, b: any) => b.id - a.id)[0] || {}
    const currentState = currentStatus || csOld
    const buttons = []

    if ([1, 99, 'IN_PROGRESS', 'REJECTED'].includes(currentState) && !jackpot.enabled) {
        buttons.push(
            <Button block onClick={() => submitApproval(jackpot.id, askRefresh)} id="approve-flow-sba" color="info">
                <Typography translateGroup="approve-flow" translateKey="submit-approval" />
            </Button>,
        )
    }
    // approve reject
    if ([2, 'SUBMITTED'].includes(currentState) && ['ADMIN', 'ROOT'].includes(userRole)) {
        buttons.push(
            <Button block onClick={() => approve(jackpot.id, askRefresh)} id="approve-flow-a" color="success">
                <Typography translateGroup="approve-flow" translateKey="approve" />
            </Button>,
            <Button block onClick={() => reject(jackpot.id, askRefresh)} id="approve-flow-r" color="danger">
                <Typography translateGroup="approve-flow" translateKey="reject" />
            </Button>,
        )
    }
    // enable disable
    if (([50, 'APPROVED'].includes(currentState) || jackpot.enabled) && ['ADMIN', 'ROOT'].includes(userRole)) {
        if (jackpot.enabled) {
            buttons.push(
                <Button block onClick={() => disable(jackpot.id, askRefresh)} id="approve-flow-d" color="warning-outline">
                    <Typography translateGroup="approve-flow" translateKey="disable" />
                </Button>,
            )
        } else {
            buttons.push(
                <Button block onClick={() => enable(jackpot.id, askRefresh)} id="approve-flow-e" color="success-outline">
                    <Typography translateGroup="approve-flow" translateKey="enable" />
                </Button>,
            )
        }
    }
    // delete
    if (['ADMIN', 'ROOT'].includes(userRole) && !jackpot.enabled) {
        buttons.push(
            <Button block onClick={() => deleteJp(jackpot.id, askRefresh)} id="approve-flow-de" color="danger">
                <Typography translateGroup="approve-flow" translateKey="delete" />
            </Button>,
        )
    }
    return buttons
}

interface ColumnsI {
    userRole: userRoleType;
    askRefresh: Function;
    addCloneButton?: boolean;
    setSelectedItem: Function;
}

export function columns({
    userRole,
    askRefresh,
    addCloneButton,
    setSelectedItem,
}: ColumnsI): Array<dataGridColumnType> {
    return (
        [
            {
                label: 'id',
                key: 'id',
                uniqueId: 'id-pk',
                filter: true,
                style: {
                    maxWidth: '60px',
                },
            },
            {
                label: 'Jackpot Name',
                key: 'internalName',
                uniqueId: 'internalName',
                filter: true,
            },
            {
                label: 'Description',
                key: 'internalDescription',
                uniqueId: 'internalDescription',
                html: true,
                filter: true,
            },
            {
                label: 'Type',
                key: 'type',
                uniqueId: 'type',
                filter: true,
                style: { width: '550px' },
                render: (value: any) => {
                    return value === '1'
                        ? 'Classic'
                        : value === '2'
                            ? 'Time Based'
                            : value === '3'
                                ? 'Must Drop'
                                : value
                },
            },
            {
                uniqueId: 'id-action',
                label: 'actions',
                key: 'id',
                style: { maxWidth: '170px' },
                avoidRowClick: true,
                render: (id: number, jackpot: jackpotsI) => {
                    return (
                        <Grid gap="0.5rem">
                            {
                                returnButtons(jackpot, userRole, askRefresh)
                            }
                            {
                                addCloneButton && (
                                    <Button
                                        id="clone-cta"
                                        block
                                        color="info"
                                        onClick={async ({ target }: any) => {
                                            if (target.setAttribute) {
                                                target.setAttribute('disabled', '')
                                            }
                                            target.disabled = true
                                            target.innerHTML = 'loading...'
                                            target.style.opacity = 0.5
                                            target.style.pointerEvents = 'none'
                                            const pool: any = jackpot.pools[0]?.id ? await poolsApi.getItemsById(jackpot.pools[0]?.id as number) : poolsApi.defaultItem
                                            const seed: any = jackpot.seeds[0]?.id ? await seedsApi.getItemsById(jackpot.seeds[0]?.id as number) : seedsApi.defaultItem
                                            setSelectedItem({
                                                ...jackpot,
                                                id: 0,
                                                pools: { ...pool, id: 0 },
                                                seeds: { ...seed, id: 0 },
                                                template: false,
                                            })
                                        }}
                                    >
                                        <Typography translateGroup="jackpot-list" translateKey="clone" />
                                    </Button>
                                )
                            }
                        </Grid>
                    )
                },
            },
        ]
    )
}
