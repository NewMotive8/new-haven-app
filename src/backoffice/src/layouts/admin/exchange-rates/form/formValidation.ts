import { textTranslated } from 'components/TextTranslated'
import { exchangeRatesI } from 'utils/services/api/requests/exchangeRates'

const errorMessages = () => (
    {
        currentRate: {
            required: textTranslated({ group: 'validate-messages', key: 'this-is-required' }),
        },
        currency: {
            required: textTranslated({ group: 'validate-messages', key: 'this-is-required' }),
        },
    }
)

function validateForm(data: exchangeRatesI) {
    const errors: any = {}

    if (!data.currentRate) {
        errors.currentRate = errorMessages().currentRate.required
    }
    if (!data.currency) {
        errors.currency = errorMessages().currency.required
    }

    return { ...errors, count: Object.keys(errors).length }
}

export default validateForm
