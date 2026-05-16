import { textTranslated } from 'components/TextTranslated'
import { currenciesI } from 'utils/services/api/requests/currencies'

const errorMessages = () => (
    {
        entityKeyToBeValidated: {
            required: textTranslated({ group: 'validate-messages', key: 'this-is-required' }),
        },
    }
)

function validateForm(data: currenciesI) {
    const errors: any = {}

   // add validations

    return { ...errors, count: Object.keys(errors).length }
}

export default validateForm
