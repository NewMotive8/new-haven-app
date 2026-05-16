import { textTranslated } from 'components/TextTranslated'
import { eventsI } from 'utils/services/api/requests/tournament-api/events'

const errorMessages = () => (
    {
        name: {
            required: textTranslated({ group: 'validate-messages', key: 'this-is-required' }),
        },
        eventId: {
            required: textTranslated({ group: 'validate-messages', key: 'this-is-required' }),
        },
    }
)

function validateForm(data: eventsI) {
    const errors: any = {}

    if (!data.name) {
        errors.name = errorMessages().name.required
    }
    if (!data.eventId) {
        errors.eventId = errorMessages().eventId.required
    }
    if (
        data.contributionWeight !== undefined
        && data.contributionWeight !== null
        && Number(data.contributionWeight) < 0
    ) {
        errors.contributionWeight = textTranslated({ group: 'validate-messages', key: 'only-positive-number' })
    }

    return { ...errors, count: Object.keys(errors).length }
}

export default validateForm
