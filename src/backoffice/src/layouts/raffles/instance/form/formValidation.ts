import { textTranslated } from 'components/TextTranslated'
import { instanceI } from 'utils/services/api/requests/raffle-api/instance'

const errorMessages = () => (
    {
        required: textTranslated({ group: 'validate-messages', key: 'this-is-required' }),
        integerMinOne: 'Must be an integer greater than or equal to 1',
    }
)

function validateForm(data: instanceI) {
    const errors: any = {}

    if (!data.name) {
        errors.name = errorMessages().required
    }

    if (!data.drawAtUtc) {
        errors.drawAtUtc = errorMessages().required
    }

    if (data.maxEntriesPerPlayer !== null && data.maxEntriesPerPlayer !== undefined && data.maxEntriesPerPlayer !== ('' as any)) {
        const value = Number(data.maxEntriesPerPlayer)
        if (!Number.isInteger(value) || value < 1) {
            errors.maxEntriesPerPlayer = errorMessages().integerMinOne
        }
    }

    return { ...errors, count: Object.keys(errors).length }
}

export default validateForm
