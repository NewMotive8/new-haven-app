import { textTranslated } from 'components/TextTranslated'
import { instanceI } from 'utils/services/api/requests/tournament-api/instance'

const errorMessages = () => (
    {
        entityKeyToBeValidated: {
            required: textTranslated({ group: 'validate-messages', key: 'this-is-required' }),
        },
    }
)

function validateForm(data: instanceI) {
    const errors: any = {}

    if (!data.name) {
        errors.name = errorMessages().entityKeyToBeValidated.required
    }

    return { ...errors, count: Object.keys(errors).length }
}

export default validateForm
