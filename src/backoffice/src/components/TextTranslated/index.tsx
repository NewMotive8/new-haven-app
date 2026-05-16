/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react/no-danger */
import { useRouter } from 'next/router'
import { globalData } from 'pages/_app'
import React from 'react'
import EditTranslation from './editorTranslation'

interface Replaces {
    code: string,
    value: any
}
interface Props {
    group: string,
    key: string,
    replaces?: Array<Replaces>,
    defaultContent?: any,
    returnDefault?: 'translateKey' | 'nothing' | 'defaultContent'
}

function checkReplace(textPure: any, replaces: Array<Replaces>) {
    let textS = textPure
    if (replaces?.length && textPure) {
        replaces.map((r: Replaces) => {
            if (textS && typeof textS === 'string') {
                textS = textS?.replace(r.code, r.value)
            }
            return textS || textPure
        })
    }
    return textS || textPure
}

function returnText(translations: any, group: any, textCode: any, locale: any) {
    const textFromLocale = (translations?.length && translations?.find((t: any) => (t.group?.toLowerCase() === group?.toLowerCase() && t.key?.toLowerCase() === textCode?.toLowerCase() && t.locale?.toLowerCase() === locale?.toLowerCase())))
    return textFromLocale || (translations?.length && translations?.find((t: any) => (t.group?.toLowerCase() === group?.toLowerCase() && t.key?.toLowerCase() === textCode?.toLowerCase() && t.locale?.toLowerCase() === 'en-gb')))
}

export function textTranslated(props: Props) {
    const {
        group,
        key,
        replaces,
        returnDefault,
        defaultContent,
    } = props
    const { translations, editTranslations, locale } = globalData
    const text: any = returnText(translations, group, key, locale) || {}

    if (editTranslations) {
        return (
            <>
                {
                    text
                        ? text.isHTML || text.isHtml
                            ? <section dangerouslySetInnerHTML={{ __html: (checkReplace((text.value || key), replaces as Array<Replaces>)) }} />
                            : checkReplace((text.value || key), replaces as Array<Replaces>)
                        : key
                }
                <EditTranslation
                    currentTranslation={{
                        group, key, client: 'BO', locale, replaces,
                    }}
                />
            </>
        )
    }

    const returnDefaultValue = returnDefault === 'nothing' ? '' : returnDefault === 'defaultContent' ? defaultContent : key

    return text
        ? text.isHTML || text.isHtml
            ? <section dangerouslySetInnerHTML={{ __html: (checkReplace((text.value || returnDefaultValue), replaces as Array<Replaces>)) }} />
            : checkReplace((text.value || returnDefaultValue), replaces as Array<Replaces>)
        : returnDefaultValue
}
