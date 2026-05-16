import { textTranslated } from 'components/TextTranslated'
import { poolsI } from 'utils/services/api/requests/pools'

const errorMessages = () => (
    {
        entityKeyToBeValidated: {
            required: textTranslated({ group: 'validate-messages', key: 'this-is-required' }),
        },
    }
)

function validateForm(data: poolsI) {
    const errors: any = {}

   // add validations

    return { ...errors, count: Object.keys(errors).length }
}

export default validateForm
