import confirmBox from 'components/selectors/confirmBox'
import Button from 'components/uiKit/buttons'
import { dataGridColumnType } from 'components/uiKit/dataGridV3'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import { toastSuccess } from 'utils/functions/notifications'
import { approveWin, rejectWin } from '../../../../utils/services/api/requests/jackpots'

// ---------------------------------------------
// APPROVE DIALOG — NO MORE PAGE RELOAD
// ---------------------------------------------
const approveDialog = (
    winId: number,
    onSuccess: () => void,
    setLoading: (v: boolean) => void
) => ({
    confirmMessage: (
        <Grid gap="1rem">
            <Grid>
                <Typography
                    translateGroup="wins-list"
                    translateKey="are-you-sure?"
                    style={{ width: '100%', textAlign: 'center' }}
                />
            </Grid>
            <Grid>
                <Typography
                    translateGroup="wins-list"
                    translateKey="this-win-will-be-approved"
                    style={{ width: '100%', textAlign: 'center' }}
                />
            </Grid>
        </Grid>
    ),

    onConfirm: async () => {
        setLoading(true)
        try {
            await approveWin(winId)
            toastSuccess("Win approved.")
            onSuccess()
        } finally {
            setLoading(false)
        }
    },
})

// ---------------------------------------------
// REJECT DIALOG — FULL PAGE SPINNER ADDED
// ---------------------------------------------
const unApproveDialog = (
    winId: number,
    onSuccess: () => void,
    setLoading: (v: boolean) => void
) => ({
    confirmMessage: (
        <Grid gap="1rem">
            <Grid>
                <Typography
                    translateGroup="wins-list"
                    translateKey="are-you-sure?"
                    style={{ width: '100%', textAlign: 'center' }}
                />
            </Grid>
            <Grid>
                <Typography
                    translateGroup="wins-list"
                    translateKey="this-win-will-be-rejected"
                    style={{ width: '100%', textAlign: 'center' }}
                />
            </Grid>
        </Grid>
    ),

    onConfirm: async () => {
        setLoading(true)
        try {
            await rejectWin(winId)
            toastSuccess("Win rejected.")
            onSuccess()
        } finally {
            setLoading(false)
        }
    },
})

// ---------------------------------------------
// APPROVED TABLE COLUMNS
// ---------------------------------------------
export const columns: Array<dataGridColumnType> = [
    {
        key: 'player.brandPlayerId',
        uniqueId: 'player.brandPlayerId',
        label: 'player',
        filter: true,
    },
    {
        key: 'amountWon',
        uniqueId: 'amountWon',
        label: 'amountWon',
        filter: true,
    },
]

// ---------------------------------------------
// UNAPPROVED TABLE COLUMNS (with refresh & loading)
// ---------------------------------------------
export const unapprovedColumns = (
    onRefresh: () => void,
    setLoading: (v: boolean) => void
): Array<dataGridColumnType> => [
    {
        key: 'player.brandPlayerId',
        uniqueId: 'unapproved-player.brandPlayerId',
        label: 'player',
        filter: true,
    },
    {
        key: 'amountWon',
        uniqueId: 'unapproved-player.amountWon',
        label: 'amountWon',
        filter: true,
    },
    {
        key: 'id',
        uniqueId: 'actions',
        label: 'actions',
        style: { maxWidth: '300px' },

        render: (id: number, row: any) => (
            <Grid gap="0.5rem" wrap="nowrap">
                {/* APPROVE */}
                <Button
                    block
                    color="success"
                    id="wins-list-approve"
                    onClick={() =>
                        confirmBox(approveDialog(row.id, onRefresh, setLoading))
                    }
                >
                    <Typography translateGroup="win-list-actions" translateKey="approve" />
                </Button>

                {/* REJECT */}
                <Button
                    block
                    color="danger"
                    id="wins-list-unapproved"
                    onClick={() =>
                        confirmBox(unApproveDialog(row.id, onRefresh, setLoading))
                    }
                >
                    <Typography translateGroup="win-list-actions" translateKey="reject" />
                </Button>
            </Grid>
        ),
    },
]
