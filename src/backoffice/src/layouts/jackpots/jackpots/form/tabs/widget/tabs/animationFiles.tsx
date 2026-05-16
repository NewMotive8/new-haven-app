import Typography from 'components/uiKit/typography'

export const lottieExamples = [
    'https://joobacdn.pages.dev/cdn/lottie/coinsFalling.json',
    'https://assets6.lottiefiles.com/packages/lf20_ki32ento.json',
    'https://assets8.lottiefiles.com/packages/lf20_wys2rrr6.json',
    'https://assets8.lottiefiles.com/packages/lf20_byBsNp.json',
    'https://assets8.lottiefiles.com/datafiles/3rgYURIz8yEcfGk/data.json',
    'https://assets8.lottiefiles.com/packages/lf20_xldzoar8.json',
].map((item, i) => ({
    label: (
        <Typography
            translateGroup="widget-animation-lottie-options"
            translateKey={`option-${i + 1}`}
        />
    ),
    value: item,
}))
