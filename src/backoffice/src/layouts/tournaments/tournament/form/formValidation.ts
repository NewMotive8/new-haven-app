import { textTranslated } from 'components/TextTranslated'
import { tournamentRaceI } from 'utils/services/api/requests/tournament-api/tournamentRace'

const errorMessages = () => (
    {
        entityKeyToBeValidated: {
            required: textTranslated({ group: 'validate-messages', key: 'this-is-required' }),
        },
    }
)

function validateForm(data: tournamentRaceI) {
    const errors: any = {}

    if (!data.name) {
        errors.name = errorMessages().entityKeyToBeValidated.required
    }

    return { ...errors, count: Object.keys(errors).length }
}

export default validateForm
