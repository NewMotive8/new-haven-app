import { textTranslated } from 'components/TextTranslated'
import { alertsI } from 'utils/services/api/requests/alerts'

const errorMessages = () => ({
  entityKeyToBeValidated: {
    required: textTranslated({
      group: 'validate-messages',
      key: 'this-is-required',
    }),
  },
})

function validateForm(data: alertsI) {
  const errors: any = {}

  // if (!data.entityKeyToBeValidated) {
  //     errors.name = errorMessages().entityKeyToBeValidated.required
  // }

  return { ...errors, count: Object.keys(errors).length }
}

export default validateForm
