import { TabSelectorTabI } from 'components/selectors/tabSelector'
import Typography from 'components/uiKit/typography'
import FixedTab from './tabs/fixed'
import AverageTab from './tabs/average'
import MaximumTab from './tabs/maximum'

export function formTabs({ isMustDrop, isMultiLevel, disabled }:any): Array<TabSelectorTabI> {
  return [
  {
    value: 1,
    label: (
      <Typography
        translateGroup="forms-tabs-label"
        translateKey="jackpot-model-fixed-info"
        weight={600}
      />
    ),
    content: <FixedTab />,
    hidden: isMustDrop || isMultiLevel,
    disabled,
  },
  {
    value: 2,
    label: (
      <Typography
        translateGroup="forms-tabs-label"
        translateKey="jackpot-model-average-info"
        weight={600}
      />
    ),
    content: <AverageTab />,
    hidden: isMustDrop,
    disabled,
  },
  {
    value: 3,
    label: (
      <Typography
        translateGroup="forms-tabs-label"
        translateKey="jackpot-model-maximum-info"
        weight={600}
      />
    ),
    hidden: isMustDrop,
    content: <MaximumTab />,
    disabled,
  },
]
}
