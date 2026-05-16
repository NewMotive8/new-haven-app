import { textTranslated } from 'components/TextTranslated'
import { playerWinsI } from 'utils/services/api/requests/tournament-api/playerWins'

const errorMessages = () => (
    {
        entityKeyToBeValidated: {
            required: textTranslated({ group: 'validate-messages', key: 'this-is-required' }),
        },
    }
)

function validateForm(data: playerWinsI) {
    const errors: any = {}

    // if (!data) {
    //     errors.name = errorMessages().entityKeyToBeValidated.required
    // }

   // add validations

    return { ...errors, count: Object.keys(errors).length }
}

export default validateForm
