import { textTranslated } from 'components/TextTranslated'

const errorMessages = () => (
    {
        required: textTranslated({ group: 'validate-messages', key: 'this-is-required' }),
    }
)
export function validateStep(step: any, selectItem: any) {
    const errors: any = {}

    if (step === 'setup') {
        if (!selectItem.type) {
            errors.jackpotType = errorMessages().required
        }
        return { ...errors, count: Object.keys(errors).length }
    }
    if (step === 'model') {
        if (!selectItem.type) {
            errors.model = errorMessages().required
        }
        if (selectItem.model === 1 && !selectItem.fixedWinAmount) {
            errors.fixedWinAmount = errorMessages().required
        }
        if (selectItem.type !== 'MULTI_LEVEL' && selectItem.model === 2 && !selectItem.averageWinAmount) {
            errors.averageWinAmount = errorMessages().required
        }
        if (selectItem.model === 3 && !selectItem.maximumWinAmount) {
            errors.maximumWinAmount = errorMessages().required
        }
        return { ...errors, count: Object.keys(errors).length }
    }
    if (step === 'pool') {
        if (!selectItem?.pools[0]?.contributionAmount) {
            errors.contributionAmount = errorMessages().required
        }
        return { ...errors, count: Object.keys(errors).length }
    }
    if (step === 'seed') {
        if (selectItem?.pools[0]?.minimumAmount && !selectItem?.seeds[0]?.contributionAmount) {
            errors.contributionAmount = errorMessages().required
        }
        return { ...errors, count: Object.keys(errors).length }
    }

    if (step === 'schedule') {
        if (!selectItem.mustDropPeriod) {
            errors.mustDropPeriod = errorMessages().required
        }
        if (selectItem.mustDropPeriod === 1 && !selectItem.startDate) {
            errors.startDate = errorMessages().required
        }
        if (selectItem.mustDropPeriod === 1 && !selectItem.endDate) {
            errors.endDate = errorMessages().required
        }
    }

    return { ...errors, count: Object.keys(errors).length }
}
