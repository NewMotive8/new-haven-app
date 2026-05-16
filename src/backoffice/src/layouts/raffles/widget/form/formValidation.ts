import { textTranslated } from 'components/TextTranslated'
import { widgetI } from 'utils/services/api/requests/raffle-api/widget'

const requiredMsg = textTranslated({
  group: 'validate-messages',
  key: 'this-is-required',
})

function validateForm(data: widgetI) {
  const errors: Record<string, string> = {}

  // REQUIRED FIELDS (adjust if backend rules change)
  if (!data.locale) {
    errors.locale = requiredMsg
  }

  if (!data.headerText) {
    errors.headerText = requiredMsg
  }

  if (!data.startText) {
    errors.startText = requiredMsg
  }

  if (!data.endText) {
    errors.endText = requiredMsg
  }

  if (!data.backgroundRGB) {
    errors.backgroundRGB = requiredMsg
  }

  if (!data.winningBackgroundRGB) {
    errors.winningBackgroundRGB = requiredMsg
  }

  if (!data.winningAnimation) {
    errors.winningAnimation = requiredMsg
  }

  if (!data.termsAndConditions) {
    errors.termsAndConditions = requiredMsg
  }

  if (!data.tcsIsLink) {
    errors.tcsIsLink = requiredMsg
  }
  return {
    ...errors,
    count: Object.keys(errors).length,
  }
}

export default validateForm
