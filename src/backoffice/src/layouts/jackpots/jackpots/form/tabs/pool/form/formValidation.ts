import { textTranslated } from 'components/TextTranslated'
import { jackpotsI } from 'utils/services/api/requests/jackpots'
import { poolsI } from 'utils/services/api/requests/pools'

const errorMessages = () => (
    {
      multiLevelWeight: {
        maxValue: textTranslated({ group: 'validate-messages', key: 'this-maximum-weight' }),
        },
        required: textTranslated({
          group: 'validate-messages',
          key: 'this-is-required',
        }),
    }
)

export function validateForm(data: jackpotsI) {
    const erros: any = {}
    const maxWeight = data.pools.reduce(
      (acc, obj) => acc + Number(obj?.multiLevelWeight || 0),
      0,
    )

    if (maxWeight > 1) {
      erros.multiLevelWeight = errorMessages().multiLevelWeight.maxValue
    }

    return { ...erros, count: Object.keys(erros).length }
}

export function validatePool(data:poolsI) {
  const erros: any = {}

    if (data.contributionAmount <= 0) {
      erros.contributionAmount = errorMessages().required
    }
    return { ...erros, count: Object.keys(erros).length }
}
