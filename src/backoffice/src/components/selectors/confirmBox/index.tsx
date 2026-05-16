import Card from 'components/cards/card'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import { externalDialogCall } from 'context/dialog'
import React from 'react'

interface ConfirmBoxI {
    onConfirm: () => void;
    onCancel?: () => void;
    confirmMessage: React.ReactNode;
}
export default function confirmBox({ confirmMessage, onCancel, onConfirm }: ConfirmBoxI) {
    function handleCancel() {
        externalDialogCall.removeDialog('CONFIRM-DIALOG')
        if (onCancel) { onCancel() }
    }

    function handleConfirm() {
        externalDialogCall.removeDialog('CONFIRM-DIALOG')
        onConfirm()
    }

    externalDialogCall.displayDialog({
        dialogId: 'CONFIRM-DIALOG',
        content: (
            <Card
                color="secondary"
                padding={['p-3', 'pt-5']}
                style={{
                    width:'100%',
                    maxWidth: 'calc(100vw - 2rem)',
                    maxHeight: 'calc(100dvh - 4rem)',
                    overflowY: 'auto',
                }}
                animateOnScroll
                animation="zoom-in"
                animationDuration="100ms"
            >
                <Grid padding={['pt-5', 'pb-5']}>
                    {confirmMessage}
                </Grid>
                <Grid horizontalAlgin="space-between">
                    <Button id="cancel-button" color="primary-outline" onClick={() => handleCancel()}>
                        <Typography
                            translateGroup="global"
                            translateKey="cancel"
                        />
                    </Button>
                    <Button id="confirm-button" color="primary" onClick={() => handleConfirm()}>
                        <Typography
                            translateGroup="global"
                            translateKey="confirm"
                        />
                    </Button>
                </Grid>
            </Card>

        ),
    })
}
