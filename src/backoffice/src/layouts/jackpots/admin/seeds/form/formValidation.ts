import { textTranslated } from 'components/TextTranslated'
import { seedsI } from 'utils/services/api/requests/seeds'

const errorMessages = () => (
    {
        entityKeyToBeValidated: {
            required: textTranslated({ group: 'validate-messages', key: 'this-is-required' }),
        },
    }
)

function validateForm(data: seedsI) {
    const errors: any = {}

   // add validations

    return { ...errors, count: Object.keys(errors).length }
}

export default validateForm
