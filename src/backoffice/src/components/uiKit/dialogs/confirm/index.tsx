import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import DialogContext from 'context/dialog'
import { useContext } from 'react'
import Dialog from '..'
import { DialogConfirmProps } from './types'

const mouseDown: any = null
export default function DialogConfirmDialog({
  onCancelCallBack,
  onConfirmCallBack,
  title,
  cancelLabel,
  confirmLabel,
  children,
}: DialogConfirmProps) {
  const { displayDialog, removeDialog } = useContext(DialogContext)

  function handleCancel() {
    onCancelCallBack()
    removeDialog('CONFIRM-DIALOG')
  }

  function handleConfirm() {
    onConfirmCallBack()
    removeDialog('CONFIRM-DIALOG')
  }

  return (
    <Dialog height="100" anchor="center" onClose={() => handleCancel()}>
      <Grid
        style={{
          width: '25vw',
          maxWidth: '90vw',
          background: 'var(--root-bg)',
          borderRadius: '4pt',
        }}
        padding={['pt-5', 'pb-5', 'ps-3', 'pe-3']}
        horizontalAlgin="center"
      >
        <Grid margin="mb-5" horizontalAlgin="center">
          {title}
        </Grid>
        <Grid horizontalAlgin="center" margin="mb-5">
          {children}
        </Grid>
        <Grid horizontalAlgin="space-between">
          <Grid width={45}>
            <Button
              id="confirm-dialog-cancel-cta"
              type="button"
              block
              onClick={() => handleCancel()}
              color="secondary"
            >
              {cancelLabel}
            </Button>
          </Grid>
          <Grid width={45}>
            <Button
              id="confirm-dialog-confirm-cta"
              type="button"
              block
              onClick={() => handleConfirm()}
              color="primary"
            >
              {confirmLabel}
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </Dialog>
  )
}
