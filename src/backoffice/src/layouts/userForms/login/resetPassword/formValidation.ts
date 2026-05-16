import { textTranslated } from 'components/TextTranslated'

interface ValidateProps {
  email: string;
}

const errorMessages = () => ({
  email: {
    required: textTranslated({
      group: 'validate-messages',
      key: 'this-is-required',
    }),
  },
})

function validateForm(data: ValidateProps) {
  const errors: any = {}
  if (!data.email) {
    errors.email = errorMessages().email.required
  }

  return { ...errors, count: Object.keys(errors).length }
}

export default validateForm
