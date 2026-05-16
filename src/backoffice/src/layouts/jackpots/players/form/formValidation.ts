import { textTranslated } from 'components/TextTranslated'
import { playersI } from 'utils/services/api/requests/players'

const errorMessages = () => (
    {
        entityKeyToBeValidated: {
            required: textTranslated({ group: 'validate-messages', key: 'this-is-required' }),
        },
    }
)

function validateForm(data: playersI) {
    const errors: any = {}

   // add validations

    return { ...errors, count: Object.keys(errors).length }
}

export default validateForm
