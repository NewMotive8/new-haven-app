import { textTranslated } from 'components/TextTranslated'
import { eventsI } from 'utils/services/api/requests/raffle-api/events'

const errorMessages = () => (
    {
        required: textTranslated({ group: 'validate-messages', key: 'this-is-required' }),
    }
)

function validateForm(data: eventsI) {
    const errors: any = {}

    if (!data.name) {
        errors.name = errorMessages().required
    }

    if (!data.eventId) {
        errors.eventId = errorMessages().required
    }

    return { ...errors, count: Object.keys(errors).length }
}

export default validateForm
