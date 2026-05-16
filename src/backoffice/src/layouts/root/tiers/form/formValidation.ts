import { textTranslated } from 'components/TextTranslated'
import { tiersI } from 'utils/services/api/requests/tiers'

const errorMessages = () => (
    {
            required: textTranslated({ group: 'validate-messages', key: 'this-is-required' }),
    }
)

function validateForm(data: tiersI) {
    const errors: any = {}

   // add validations

    return { ...errors, count: Object.keys(errors).length }
}

export default validateForm
