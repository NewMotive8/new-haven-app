import { textTranslated } from 'components/TextTranslated'
import { jackpotRaceI } from 'utils/services/api/requests/jackpot-race-api/jackpotRace'

const errorMessages = () => (
    {
        entityKeyToBeValidated: {
            required: textTranslated({ group: 'validate-messages', key: 'this-is-required' }),
        },
    }
)

function validateForm(data: jackpotRaceI) {
    const errors: any = {}

    if (!data.name) {
        errors.name = errorMessages().entityKeyToBeValidated.required
    }

    return { ...errors, count: Object.keys(errors).length }
}

export default validateForm
