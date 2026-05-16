import log from "../../log"

export function formatCurrency(amount: number, currency: string): string {
    log(['amount', amount, typeof amount])
    const formattedAmount = new Intl.NumberFormat(
        [],
        {
            style: 'currency',
            currency: currency || 'USD',
            currencyDisplay: 'narrowSymbol'
        } as any)
        .format(amount)

       return formattedAmount.replace('GH₵', '₵') 
}