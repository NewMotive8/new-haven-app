import confirmBox from 'components/selectors/confirmBox'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import { toastError, toastSuccess } from 'utils/functions/notifications'
import jackpotsApi from 'utils/services/api/requests/jackpots'

export function submitApproval(jackpotId: number, askRefresh: Function) {
    confirmBox({
        confirmMessage: (
            <Grid gap="1rem">
                <Grid>
                    <Typography
                        translateGroup="approve-flow-submitApproval"
                        translateKey="are-you-sure?"
                        size="md"
                        style={{ width: '100%', textAlign: 'center' }}
                    />
                </Grid>
                <Grid>
                    <Typography
                        translateGroup="approve-flow-submitApproval"
                        translateKey="the-jackpot-will-be-submitted-to-approval"
                        style={{ width: '100%', textAlign: 'center' }}
                    />
                </Grid>
            </Grid>
        ),
        onConfirm: () => {
            jackpotsApi.submitApproval(jackpotId).then(() => {
                toastSuccess(<Typography translateGroup="approve-flow-submitApproval" translateKey="jackpot-submitted-to-approbation" />)
                askRefresh()
            }).catch(() => {
                toastError(<Typography translateGroup="approve-flow-submitApproval" translateKey="something-went-wrong" />)
            })
        },
    })
}

export function approve(jackpotId: number, askRefresh: Function) {
    confirmBox({
        confirmMessage: (
            <Grid gap="1rem">
                <Grid>
                    <Typography
                        translateGroup="approve-flow-approve"
                        translateKey="are-you-sure?"
                        size="md"
                        style={{ width: '100%', textAlign: 'center' }}
                    />
                </Grid>
                <Grid>
                    <Typography
                        translateGroup="approve-flow-approve"
                        translateKey="the-jackpot-will-be-approved"
                        style={{ width: '100%', textAlign: 'center' }}
                    />
                </Grid>
            </Grid>
        ),
        onConfirm: () => {
            jackpotsApi.approve(jackpotId).then(() => {
                toastSuccess(<Typography translateGroup="approve-flow-approve" translateKey="jackpot-approved-successfully" />)
                askRefresh()
            }).catch(() => {
                toastError(<Typography translateGroup="approve-flow-approve" translateKey="something-went-wrong" />)
            })
        },
    })
}

export function reject(jackpotId: number, askRefresh: Function) {
    confirmBox({
        confirmMessage: (
            <Grid gap="1rem">
                <Grid>
                    <Typography
                        translateGroup="approve-flow-reject"
                        translateKey="are-you-sure?"
                        size="md"
                        style={{ width: '100%', textAlign: 'center' }}
                    />
                </Grid>
                <Grid>
                    <Typography
                        translateGroup="approve-flow-reject"
                        translateKey="the-jackpot-will-be-rejected"
                        style={{ width: '100%', textAlign: 'center' }}
                    />
                </Grid>
            </Grid>
        ),
        onConfirm: () => {
            jackpotsApi.reject(jackpotId).then(() => {
                toastSuccess(<Typography translateGroup="approve-flow-reject" translateKey="jackpot-rejected-successfully" />)
                askRefresh()
            }).catch(() => {
                toastError(<Typography translateGroup="approve-flow-reject" translateKey="something-went-wrong" />)
            })
        },
    })
}

export function enable(jackpotId: number, askRefresh: Function) {
    confirmBox({
        confirmMessage: (
            <Grid gap="1rem">
                <Grid>
                    <Typography
                        translateGroup="approve-flow-enable"
                        translateKey="are-you-sure?"
                        size="md"
                        style={{ width: '100%', textAlign: 'center' }}
                    />
                </Grid>
                <Grid>
                    <Typography
                        translateGroup="approve-flow-enable"
                        translateKey="the-jackpot-will-be-enabled"
                        style={{ width: '100%', textAlign: 'center' }}
                    />
                </Grid>
            </Grid>
        ),
        onConfirm: () => {
            jackpotsApi.enable(jackpotId).then(() => {
                toastSuccess(<Typography translateGroup="approve-flow-enable" translateKey="jackpot-enabled-successfully" />)
                askRefresh()
            }).catch(() => {
                toastError(<Typography translateGroup="approve-flow-enable" translateKey="something-went-wrong" />)
            })
        },
    })
}

export function disable(jackpotId: number, askRefresh: Function) {
    confirmBox({
        confirmMessage: (
            <Grid gap="1rem">
                <Grid>
                    <Typography
                        translateGroup="approve-flow-disable"
                        translateKey="are-you-sure?"
                        size="md"
                        style={{ width: '100%', textAlign: 'center' }}
                    />
                </Grid>
                <Grid>
                    <Typography
                        translateGroup="approve-flow-disable"
                        translateKey="the-jackpot-will-be-disabled"
                        style={{ width: '100%', textAlign: 'center' }}
                    />
                </Grid>
            </Grid>
        ),
        onConfirm: () => {
            jackpotsApi.disable(jackpotId).then(() => {
                toastSuccess(<Typography translateGroup="approve-flow-disable" translateKey="jackpot-disabled-successfully" />)
                askRefresh()
            }).catch(() => {
                toastError(<Typography translateGroup="approve-flow-disable" translateKey="something-went-wrong" />)
            })
        },
    })
}

export function deleteJp(jackpotId: number, askRefresh: Function) {
    confirmBox({
        confirmMessage: (
            <Grid gap="1rem">
                <Grid>
                    <Typography
                        translateGroup="approve-flow-deleteJp"
                        translateKey="are-you-sure?"
                        size="md"
                        style={{ width: '100%', textAlign: 'center' }}
                    />
                </Grid>
                <Grid>
                    <Typography
                        translateGroup="approve-flow-deleteJp"
                        translateKey="the-jackpot-will-be-deleted"
                        style={{ width: '100%', textAlign: 'center' }}
                    />
                </Grid>
            </Grid>
        ),
        onConfirm: () => {
            jackpotsApi.softDelete(jackpotId).then(() => {
                toastSuccess(<Typography translateGroup="approve-flow-deleteJp" translateKey="jackpot-delete-successfully" />)
                askRefresh()
            }).catch(() => {
                toastError(<Typography translateGroup="approve-flow-deleteJp" translateKey="something-went-wrong" />)
            })
        },
    })
}
