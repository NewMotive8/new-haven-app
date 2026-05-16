import { textTranslated } from 'components/TextTranslated'
import { translationsI } from 'utils/services/api/requests/translationsJP'

const errorMessages = () => (
    {
        entityKeyToBeValidated: {
            required: textTranslated({ group: 'validate-messages', key: 'this-is-required' }),
        },
    }
)

function validateForm(data: translationsI) {
    const errors: any = {}

    return { ...errors, count: Object.keys(errors).length }
}

export default validateForm
