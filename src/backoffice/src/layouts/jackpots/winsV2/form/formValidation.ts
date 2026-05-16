import { textTranslated } from 'components/TextTranslated'
import { winsV2I } from 'utils/services/api/requests/winsV2'

const errorMessages = () => (
    {
        entityKeyToBeValidated: {
            required: textTranslated({ group: 'validate-messages', key: 'this-is-required' }),
        },
    }
)

function validateForm(data: winsV2I) {
    const errors: any = {}

    return { ...errors, count: Object.keys(errors).length }
}

export default validateForm
