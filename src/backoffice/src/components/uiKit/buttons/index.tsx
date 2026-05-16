import React from 'react'
import { globalData } from 'pages/_app'
import Route from 'next/router'
import { buttonProps } from './types'
import styles from './button.module.scss'

export default function Button({
    id,
    type,
    color,
    margin,
    children,
    style: styleProps,
    textPattern,
    weight,
    state,
    block,
    styleButton,
    onClick,
    ...extendedProps
}: buttonProps) {
    const { editTranslations } = globalData
    function handleClick(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        if (editTranslations) {
            return e?.target === e?.currentTarget && onClick && onClick(e)
        }
        return onClick && onClick(e)
    }

    return (
        <button
            data-status
            className={styles.button}
            data-color={color || 'primary'}
            data-margin={margin}
            data-state={state}
            data-block={block}
            data-style-button={styleButton}
            type={type === 'submit' ? 'submit' : 'button'} // the only way is explicit type to clear the eslint error
            onClick={(e) => handleClick(e)}
            onDoubleClick={(e) => onClick && onClick(e)}
            {...extendedProps}
            style={{
                fontWeight: weight || 600,
                textTransform: textPattern || 'capitalize',
                ...styleProps,
            }}
        >
            {children}
        </button>
    )
}
