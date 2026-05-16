import { textTranslated } from 'components/TextTranslated'
import { operatorsI } from 'utils/services/api/requests/operators'

const errorMessages = () => (
    {
        required: textTranslated({ group: 'validate-messages', key: 'this-is-required' }),
    }
)

function validateForm(data: operatorsI) {
    const errors: any = {}

    if (!data.name) {
        errors.name = errorMessages().required
    }
    if (!data.operatorId) {
        errors.operatorId = errorMessages().required
    }

    return { ...errors, count: Object.keys(errors).length }
}

export default validateForm
