import { textTranslated } from 'components/TextTranslated';
import { WheelRuleInstanceDTO } from 'utils/services/api/requests/luckWheel/ruleInstace';

const errorMessages = () => ({
  any: {
    required: textTranslated({
      group: 'validate-messages',
      key: 'this-is-required',
    }),
  },
});

function validateForm(data: WheelRuleInstanceDTO) {
  const errors: any = {};

  return { ...errors, count: Object.keys(errors).length };
}

export default validateForm;
