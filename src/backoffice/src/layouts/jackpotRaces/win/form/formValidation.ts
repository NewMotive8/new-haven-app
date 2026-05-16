import { textTranslated } from 'components/TextTranslated'
import { winI } from 'utils/services/api/requests/jackpot-race-api/win'

const errorMessages = () => (
    {
        entityKeyToBeValidated: {
            required: textTranslated({ group: 'validate-messages', key: 'this-is-required' }),
        },
    }
)

function validateForm(data: winI) {
    const errors: any = {}

    // if (!data.) {
    //     errors.name = errorMessages().entityKeyToBeValidated.required
    // }

   // add validations

    return { ...errors, count: Object.keys(errors).length }
}

export default validateForm
