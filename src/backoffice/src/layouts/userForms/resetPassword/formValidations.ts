import { textTranslated } from 'components/TextTranslated'
import { ResetPasswordI } from './types'

export const errorMessages = () => (
    {
        newPassword: {
            required: textTranslated({ group: 'validate-messages', key: 'this-is-required' }),
        },
        confirmNewPassword: {
            required: textTranslated({ group: 'validate-messages', key: 'this-is-required' }),
            different: textTranslated({ group: 'validate-messages', key: 'this-is-invalid-different-passwords' }),
        },
    }
)

function validateForm(data: ResetPasswordI) {
    const errors: any = {}

    if (!data.newPassword) {
        errors.login = errorMessages().newPassword.required
    }
    if (!data.confirmNewPassword) {
        errors.password = errorMessages().confirmNewPassword.required
    }
    if (data.confirmNewPassword !== data.newPassword) {
        errors.confirmNewPassword = errorMessages().confirmNewPassword.different
    }
    return { ...errors, count: Object.keys(errors).length }
}

export default validateForm
