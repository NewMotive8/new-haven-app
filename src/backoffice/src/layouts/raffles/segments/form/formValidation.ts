import { textTranslated } from 'components/TextTranslated'
import { segmentsI } from 'utils/services/api/requests/raffle-api/segments'

const errorMessages = () => (
    {
        name: {
            required: textTranslated({ group: 'validate-messages', key: 'this-is-required' }),
        },
    }
)

function validateForm(data: segmentsI) {
    const errors: any = {}

    if (!data.name) {
        errors.name = errorMessages().name.required
    }

   // add validations

    return { ...errors, count: Object.keys(errors).length }
}

export default validateForm
