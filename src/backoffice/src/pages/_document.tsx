/* eslint-disable react/prop-types */
import Document, {
    Html, Head, Main, NextScript, DocumentProps,
} from 'next/document'

function MyDocument(p: DocumentProps) {
    const { __NEXT_DATA__: nextData } = p
    const { props } = nextData
    const { pageProps } = props
    const theme = pageProps?.theme || 'dark' as any

    return (
        <Html id="_html" data-theme={theme} style={{ background: theme === 'light' ? '#fff' : '#000' }}>
            <Head />
            <body id="_body" data-theme={theme}>
                <Main />
                <NextScript />
            </body>
        </Html>
    )
}

export default MyDocument
