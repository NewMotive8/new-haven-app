import { textTranslated } from 'components/TextTranslated'
import { eventsI } from 'utils/services/api/requests/events'

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

    return { ...errors, count: Object.keys(errors).length }
}

export default validateForm
