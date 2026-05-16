import { textTranslated } from 'components/TextTranslated'
import React from 'react'
import { typographyProps } from './types'
import styles from './typography.module.scss'

export default function Typography(props: typographyProps) {
    const {
        size,
        children,
        additionalChildren,
        weight,
        elementType,
        margin,
        color,
        style: styleProps,
        translateGroup,
        translateKey,
        replaces,
        returnDefault,
        defaultContent,
        algin,
    } = props
    const style = {
        fontWeight: weight || 400,
    }
    const elementsProps = {
        'data-algin': algin || '',
        'data-size': size || 'normal',
        'data-margin': margin || 'normal',
        className: `${styles.typography} ${color === 'golden-gradient' ? styles['golden-gradient'] : ''}`,
        style: { ...style, ...styleProps, ...(color && color !== 'golden-gradient' && ({ color })) },
    }

    const elements = (content: React.ReactNode) => ({
        span: (
            <span {...elementsProps}>
                {content}
                {additionalChildren}
            </span>
        ),
        p: (
            <p {...elementsProps}>
                {content}
                {additionalChildren}
            </p>
        ),
        h1: (
            <h1 {...elementsProps}>
                {content}
                {additionalChildren}
            </h1>
        ),
        h2: (
            <h2 {...elementsProps}>
                {content}
                {additionalChildren}
            </h2>
        ),
        h3: (
            <h3 {...elementsProps}>
                {content}
                {additionalChildren}
            </h3>
        ),
        h4: (
            <h4 {...elementsProps}>
                {content}
                {additionalChildren}
            </h4>
        ),
        h5: (
            <h5 {...elementsProps}>
                {content}
                {additionalChildren}
            </h5>
        ),
        h6: (
            <h6 {...elementsProps}>
                {content}
                {additionalChildren}
            </h6>
        ),
    })
    if (translateGroup && translateKey) {
        const translated = textTranslated({
            group: translateGroup,
            key: translateKey,
            replaces: replaces && (replaces),
            returnDefault,
            defaultContent,
        })
        if (typeof translated === 'object') {
            return { ...translated, props: { ...translated.props, ...elementsProps } }
        }
        return elements(translated)[elementType || 'span']
    }

    return (elements(children || (returnDefault === 'nothing' ? '' : translateKey))[elementType || 'span'])
}
