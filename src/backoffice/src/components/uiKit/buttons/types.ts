import { elementsMargin } from 'utils/globalTypes'
import { ButtonHTMLAttributes } from 'react'

export type buttonColors =
    'primary'
    | 'primary-full'
    | 'primary-outline'
    | 'secondary'
    | 'danger'
    | 'danger-outline'
    | 'success'
    | 'success-outline'
    | 'warning'
    | 'warning-outline'
    | 'info'
    | 'info-outline'
    | 'disabled'
    | 'link'

export type buttonMargin = elementsMargin

export interface buttonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    id: string,
    state?: 'disabled' | 'active',
    type?: 'submit' | 'button',
    styleButton?: 'default' | 'rounded'
    color?: buttonColors,
    block?: boolean,
    margin?: buttonMargin | Array<buttonMargin>,
    textPattern?: 'none' | 'capitalize' | 'uppercase' | 'lowercase' | 'full-width' | 'full-size-kana'
    weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800
}
