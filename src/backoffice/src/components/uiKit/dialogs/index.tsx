import CloseIcon from 'assets/icons/closeIcon'
import React, { useEffect } from 'react'
import styles from './dialog.module.scss'

export interface DialogInterface {
    children?: any;
    onClose?: (() => void) | Function | null;
    anchor?: 'center' | 'left' | 'right' | 'top';
    height?: '100' | 'UNDER-NAVBAR' | 'fit-content';
    displayClose?: boolean;
    disableOverlayClose?: boolean;
}

let mouseDown: any = null
export default function Dialog({
    children,
    onClose,
    anchor,
    height,
    displayClose,
    disableOverlayClose,
}: DialogInterface) {
    function close() {
        if (onClose) onClose()
    }
    async function overClickClose(e: any) {
        if (e?.target === e?.currentTarget && e?.target === mouseDown?.target) {
            close()
        }
    }
    function keyHandler(e: KeyboardEvent) {
        if (e.key === 'Escape' && onClose && !disableOverlayClose) {
            onClose()
        }
    }

    useEffect(() => {
        window.addEventListener('keyup', (e) => keyHandler(e))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div
            tabIndex={-1}
            data-height={height}
            data-anchor={anchor || ''}
            className={styles['dialog-wrapper']}
            onClick={(e) => { if (!disableOverlayClose) overClickClose(e) }}
            onMouseDown={(e) => { mouseDown = e }}
        >
            <div id="dialog-content-box" className={styles.dialog}>
                {
                    displayClose && (
                        <div className={styles['close-section']}>
                            <CloseIcon onClick={() => close()} />
                        </div>
                    )
                }
                {children}
            </div>
        </div>
    )
}
