import { textTranslated } from 'components/TextTranslated'
import { boTranslationsI } from 'utils/services/api/requests/boTranslations'

const errorMessages = () => (
    {
        required: textTranslated({ group: 'validate-messages', key: 'this-is-required' }),
    }
)

function validateForm(data: boTranslationsI) {
    const errors: any = {}

    return { ...errors, count: Object.keys(errors).length }
}

export default validateForm
