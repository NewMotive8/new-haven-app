export function formatCurrency(number: number, currency: string): string {
    if (currency) {
        const formattedNumber = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase(),
            minimumFractionDigits: 2,
        }).format(number)
        return formattedNumber
    }
    return ''
}

export function formatCurrencyDecimal(number: number, currency: string): string {
    if (currency) {
        const formattedNumber = new Intl.NumberFormat('en-US', {
            style: 'decimal',
            currency: currency.toUpperCase(),
            minimumFractionDigits: 2,
        }).format(number)
        return formattedNumber
    }
    return ''
}

export function onlyNumbersAndSingleDot(str: string) {
    let result = str.replace(/[^0-9.]/g, '')
    const dotIndex = result.indexOf('.')

    if (dotIndex !== -1) {
        result = result.substring(0, dotIndex + 1) + result.substring(dotIndex + 1).replace(/\./g, '')
    }

    return result
}
