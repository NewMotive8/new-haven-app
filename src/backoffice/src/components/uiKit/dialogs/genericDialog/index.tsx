import React from 'react'
import Dialog, { DialogInterface } from '..'

interface Props extends DialogInterface {
    onClose: Function,
}

export default function GenericDialog({ children, onClose, ...nProps }: Props) {
    return (
        <Dialog
            height="100"
            onClose={() => onClose()}
            displayClose
            {...nProps}
        >
            {children}
        </Dialog>
    )
}
