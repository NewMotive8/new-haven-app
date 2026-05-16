import { textTranslated } from 'components/TextTranslated'
import { LoginI } from './types'

export const errorMessages = () => (
    {
        login: {
            required: textTranslated({ group: 'validate-messages', key: 'this-is-required' }),
        },
        password: {
            required: textTranslated({ group: 'validate-messages', key: 'this-is-required' }),
        },
    }
)

function validateForm(data: LoginI) {
    const errors: any = {}

    if (!data.login) {
        errors.login = errorMessages().login.required
    }
    if (!data.password) {
        errors.password = errorMessages().password.required
    }
    return { ...errors, count: Object.keys(errors).length }
}

export default validateForm
