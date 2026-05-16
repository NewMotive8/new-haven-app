import { textTranslated } from 'components/TextTranslated';
import { WheelRuleDTO } from 'utils/services/api/requests/luckWheel/rule';

const errorMessages = () => ({
  any: {
    required: textTranslated({
      group: 'validate-messages',
      key: 'this-is-required',
    }),
  },
});

function validateForm(data: WheelRuleDTO) {
  const errors: any = {};

  return { ...errors, count: Object.keys(errors).length };
}

export default validateForm;
