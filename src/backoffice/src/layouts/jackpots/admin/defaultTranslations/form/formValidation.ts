import { textTranslated } from 'components/TextTranslated'
import { defaultTranslationsI } from 'utils/services/api/requests/defaultTranslations'

const errorMessages = () => (
    {
        required: textTranslated({ group: 'validate-messages', key: 'this-is-required' }),
    }
)

function validateForm(data: defaultTranslationsI) {
    const errors: any = {}

    return { ...errors, count: Object.keys(errors).length }
}

export default validateForm
