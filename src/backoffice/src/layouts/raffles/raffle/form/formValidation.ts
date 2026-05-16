import { textTranslated } from 'components/TextTranslated'
import { raffleI } from 'utils/services/api/requests/raffle-api/raffle'

const errorMessages = () => (
    {
        entityKeyToBeValidated: {
            required: textTranslated({ group: 'validate-messages', key: 'this-is-required' }),
        },
    }
)

function hasValue(value: any) {
    return value !== null && value !== undefined && `${value}`.trim() !== ''
}

function validateForm(data: raffleI) {
    const errors: any = {}
    const numericTickets = Number(data?.ticketsPerUnit)
    const numericAmount = Number(data?.unitAmount)
    const numericCount = Number(data?.unitCount)
    const hasRuleType = hasValue(data?.ruleType)
    const hasAnyMechanicsInput = hasRuleType
        || hasValue(data?.ticketsPerUnit)
        || hasValue(data?.unitAmount)
        || hasValue(data?.unitCount)

    if (!data.name) {
        errors.name = errorMessages().entityKeyToBeValidated.required
    }

    if (hasAnyMechanicsInput) {
        if (!data.ruleType) {
            errors.ruleType = errorMessages().entityKeyToBeValidated.required
        }

        if (!Number.isFinite(numericTickets) || numericTickets <= 0) {
            errors.ticketsPerUnit = 'Must be greater than 0'
        }

        if (data.ruleType === 'TURNOVER' || data.ruleType === 'EVENT_AMOUNT') {
            if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
                errors.unitAmount = 'Must be greater than 0'
            }
        }

        if (data.ruleType === 'BET_COUNT') {
            if (!Number.isFinite(numericCount) || numericCount <= 0) {
                errors.unitCount = 'Must be greater than 0'
            }
        }
    }

    return { ...errors, count: Object.keys(errors).length }
}

export default validateForm
