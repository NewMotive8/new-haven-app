import { textTranslated } from 'components/TextTranslated'
import { winsI } from 'utils/services/api/requests/wins'

const errorMessages = () => (
    {
        entityKeyToBeValidated: {
            required: textTranslated({ group: 'validate-messages', key: 'this-is-required' }),
        },
    }
)

function validateForm(data: winsI) {
    const errors: any = {}

   // add validations

    return { ...errors, count: Object.keys(errors).length }
}

export default validateForm
