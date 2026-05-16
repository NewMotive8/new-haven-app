import { textTranslated } from 'components/TextTranslated'
import { usersI } from 'utils/services/api/requests/users'

const errorMessages = () => (
    {
        email: {
            required: textTranslated({ group: 'validate-messages', key: 'this-is-required' }),
        },
        name: {
            required: textTranslated({ group: 'validate-messages', key: 'this-is-required' }),
        },
        password: {
            required: textTranslated({ group: 'validate-messages', key: 'this-is-required' }),
        },
        role: {
            required: textTranslated({ group: 'validate-messages', key: 'this-is-required' }),
        },
    }
)

function validateForm(data: usersI) {
    const errors: any = {}

    if (!data.email) {
        errors.email = errorMessages().email.required
    }
    if (!data.name) {
        errors.name = errorMessages().name.required
    }
    if (!data.role) {
        errors.role = errorMessages().role.required
    }

    return { ...errors, count: Object.keys(errors).length }
}

export default validateForm
