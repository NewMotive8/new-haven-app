import React, { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

const Editor = dynamic(() => import('./Editor'), { ssr: false })

interface onChangeI {
    target: {
        value: string;
        id: string;
        name: string;
    }
}

export interface EditorV2Props {
    value: string;
    onChange: (event: onChangeI) => void;
    id: string;
    name: string;
    label: string | React.ReactElement;
    feedback?: string | React.ReactElement;
    status?: 'error' | 'success' | 'warning' | 'info' | '';
    onFocus?: React.FocusEventHandler<HTMLInputElement> | undefined;

}

export default function EditorV2(props: EditorV2Props) {
    return <Editor {...props} />
}
