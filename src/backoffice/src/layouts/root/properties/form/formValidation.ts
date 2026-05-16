import { textTranslated } from 'components/TextTranslated'
import { propertiesI } from 'utils/services/api/requests/properties'

const errorMessages = () => ({
  name: {
    required: textTranslated({
      group: 'validate-messages',
      key: 'this-is-required',
    }),
  },
  value: {
    required: textTranslated({
      group: 'validate-messages',
      key: 'this-is-required',
    }),
  },
})

function validateForm(data: propertiesI) {
  const errors: any = {}

  if (!data.name) {
    errors.name = errorMessages().name.required
  }
  if (!data.value) {
    errors.value = errorMessages().value.required
  }

  return { ...errors, count: Object.keys(errors).length }
}

export default validateForm
