import { textTranslated } from 'components/TextTranslated'
import { playerI } from 'utils/services/api/requests/jackpot-race-api/player'

const errorMessages = () => (
    {
        entityKeyToBeValidated: {
            required: textTranslated({ group: 'validate-messages', key: 'this-is-required' }),
        },
    }
)

function validateForm(data: playerI) {
    const errors: any = {}

    if (!data.brandPlayerId) {
        errors.name = errorMessages().entityKeyToBeValidated.required
    }

    return { ...errors, count: Object.keys(errors).length }
}

export default validateForm
