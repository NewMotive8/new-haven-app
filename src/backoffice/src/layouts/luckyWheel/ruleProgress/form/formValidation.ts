import { textTranslated } from 'components/TextTranslated';
import { RuleProgressDTO } from 'utils/services/api/requests/luckWheel/ruleProgress';

const errorMessages = () => ({
  any: {
    required: textTranslated({
      group: 'validate-messages',
      key: 'this-is-required',
    }),
  },
});

function validateForm(data: RuleProgressDTO) {
  const errors: any = {};

  return { ...errors, count: Object.keys(errors).length };
}

export default validateForm;
