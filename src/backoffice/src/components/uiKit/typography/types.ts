import { elementsMargin } from 'utils/globalTypes'
import { CSSProperties, ReactNode } from 'react'

export type typographySize = 'xx-sm' | 'xsm' | 'sm' | 'normal' | 'md' | 'lg' | 'xl' | 'xxl' | 'big1' | 'big2' | 'big3'
export type typographyMargin = elementsMargin
interface Replaces {
    code: string,
    value: any
}
export interface typographyProps {
    style?: CSSProperties,
    size?: typographySize | Array<typographySize>,
    children?: ReactNode,
    additionalChildren?: ReactNode,
    weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800,
    elementType?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6',
    margin?: typographyMargin | Array<typographyMargin>,
    color?: 'var(--primary)' | 'var(--secondary)' | 'var(--tertiary)' | 'var(--success)' | 'var(--danger)' | 'var(--warn)' | 'var(--info)' | '#fff' | 'golden-gradient',
    translateGroup?: string,
    translateKey?: string,
    replaces?: Array<Replaces>,
    returnDefault?: 'translateKey' | 'nothing' | 'defaultContent',
    defaultContent?: any,
    algin?: 'left' | 'right' | 'center'
}
