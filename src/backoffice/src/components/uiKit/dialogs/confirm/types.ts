import { ReactNode } from 'react'

export interface DialogConfirmProps {
    title: ReactNode;
    children: ReactNode;
    cancelLabel: ReactNode;
    confirmLabel: ReactNode;
    onCancelCallBack: Function;
    onConfirmCallBack: Function;
}
