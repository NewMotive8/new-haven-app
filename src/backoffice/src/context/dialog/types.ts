import { DialogInterface } from 'components/uiKit/dialogs'
import { ReactNode } from 'react'

export interface displayDialogInterface {
    dialogId: string,
    content: ReactNode;
    onCloseCallback?: Function;
    close?: boolean;
    dialogProps?: DialogInterface;
}
