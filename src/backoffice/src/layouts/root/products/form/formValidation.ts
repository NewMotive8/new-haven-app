import { textTranslated } from 'components/TextTranslated'
import { productsI } from 'utils/services/api/requests/products'

const errorMessages = () => (
    {
        required: textTranslated({ group: 'validate-messages', key: 'this-is-required' }),
    }
)

function validateForm(data: productsI) {
    const errors: any = {}

    if (!data?.name?.trim()) {
        errors.name = errorMessages().required
    }

    return { ...errors, count: Object.keys(errors).length }
}

export default validateForm
