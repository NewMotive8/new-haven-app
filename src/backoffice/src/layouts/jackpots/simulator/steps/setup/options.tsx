import Typography from 'components/uiKit/typography'
import { ReactNode } from 'react'

interface optionsProps {
  value: 'CLASSIC' | 'MUST_DROP' | 'MULTI_LEVEL'
  label: ReactNode
}
export const options: Array<optionsProps> = [
  {
    value: 'CLASSIC',
    label: (
      <Typography translateGroup="simulator-form" translateKey="classic" />
    ),
  },
  {
    value: 'MUST_DROP',
    label: (
      <Typography translateGroup="simulator-form" translateKey="must-drop" />
    ),
  },
  {
    value: 'MULTI_LEVEL',
    label: (
      <Typography translateGroup="simulator-form" translateKey="multi-level" />
    ),
  },
]
