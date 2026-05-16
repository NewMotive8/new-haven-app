import React, { createContext, useState } from 'react'
import GenericDialog from 'components/uiKit/dialogs/genericDialog'
import { DialogConfirmProps } from 'components/uiKit/dialogs/confirm/types'
import DialogConfirmDialog from 'components/uiKit/dialogs/confirm'
import { displayDialogInterface } from './types'

interface Props {
    children: React.ReactNode
}
const DialogContext = createContext({
    displayDialog: (props: displayDialogInterface) => { },
    removeDialog: (dialogId: string) => { },
    removeAllDialogs: () => { },
    dialogConfirm: (props: DialogConfirmProps) => { },
})

export const externalDialogCall = {
    displayDialog: (dProps: displayDialogInterface) => { },
    removeDialog: (dialogId: string) => { },
    removeAllDialogs: () => { },
    dialogConfirm: (props: DialogConfirmProps) => { },
}

export function DialogProvider(props: Props) {
    const { children } = props
    const [dialogs, setDialogs] = useState<any>([])

    function displayDialog(dProps: displayDialogInterface) {
        const dialogExists: displayDialogInterface = dialogs.find((dialog: displayDialogInterface) => dialog.dialogId === dProps.dialogId)
        if (dialogExists) {
            setDialogs((current: any) => ([...[...current].filter((dialog: displayDialogInterface) => dialog.dialogId !== dProps.dialogId), { ...dProps }]))
        } else {
            setDialogs((current: any) => ([...current, { ...dProps }]))
        }
    }

    function removeDialog(dialogId: string) {
        setDialogs((currentDialogs: any) => {
            const dialogToRemove: displayDialogInterface = currentDialogs.find((dialog: displayDialogInterface) => dialog.dialogId === dialogId)
            if (dialogToRemove) {
                if (dialogToRemove?.onCloseCallback) {
                    dialogToRemove.onCloseCallback()
                }
                if (dialogToRemove?.dialogProps?.onClose) {
                    dialogToRemove?.dialogProps?.onClose()
                }
            }
            return currentDialogs.filter((dialog: displayDialogInterface) => dialog.dialogId !== dialogId)
        })
    }

    function removeAllDialogs() {
        setDialogs([])
    }
    function displayConfirm(propsConfirm: DialogConfirmProps) {
        displayDialog({
            dialogId: 'CONFIRM-DIALOG',
            content: (<DialogConfirmDialog {...propsConfirm} />),
        })
    }
    externalDialogCall.displayDialog = displayDialog
    externalDialogCall.removeDialog = removeDialog
    externalDialogCall.removeAllDialogs = removeAllDialogs
    externalDialogCall.dialogConfirm = displayConfirm

    return (
        <DialogContext.Provider value={{
            displayDialog,
            removeDialog,
            removeAllDialogs,
            dialogConfirm: displayConfirm,
        }}
        >
            {children}
            {
                dialogs?.map((dialog: displayDialogInterface) => {
                    return (
                        <GenericDialog
                            key={dialog.dialogId}
                            {...dialog?.dialogProps}
                            onClose={() => removeDialog(dialog.dialogId)}
                        >
                            {dialog.content}
                        </GenericDialog>
                    )
                })
            }
        </DialogContext.Provider>
    )
}

export default DialogContext
