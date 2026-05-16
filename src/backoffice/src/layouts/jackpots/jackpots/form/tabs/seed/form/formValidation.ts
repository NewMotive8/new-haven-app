import { textTranslated } from 'components/TextTranslated'
import { seedsI } from 'utils/services/api/requests/seeds'

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

export function validatePool(data:seedsI) {
  const erros: any = {}

    if (data.contributionAmount <= 0) {
      erros.contributionAmount = errorMessages().required
    }
    return { ...erros, count: Object.keys(erros).length }
}
