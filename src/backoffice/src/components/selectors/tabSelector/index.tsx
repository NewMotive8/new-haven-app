import React from 'react'
import Grid from 'components/uiKit/grid'
import Button from 'components/uiKit/buttons'
import Card from 'components/cards/card'
import { useThemeWatcher } from 'utils/customHooks'
import { buttonColors } from 'components/uiKit/buttons/types'

export interface TabSelectorTabI {
  label: React.ReactNode;
  value: string | number;
  icon?: React.ReactNode;
  content?: React.ReactNode;
  hidden?: boolean;
  disabled?: boolean;
}

interface TabSelectorProps {
  tabs: TabSelectorTabI[];
  currentTab?: TabSelectorTabI;
  setCurrentTab: (value: TabSelectorTabI) => void;
  header?: React.ReactNode;
  orientation?: 'vertical' | 'horizontal';
  color?: buttonColors | 'root' | 'section' | 'transparent',
}

function TabSelector({
  tabs,
  currentTab,
  setCurrentTab,
  header,
  orientation = 'vertical',
  color,
}: TabSelectorProps) {
  const renderTab = (tab: TabSelectorTabI, theme: string) => {
    const { value, label, icon } = tab
    const isSelected = currentTab?.value === value
    const buttonColor: buttonColors = orientation === 'horizontal' ? 'secondary' : isSelected ? theme === 'light' ? 'primary-full' : 'primary' : 'secondary'
    if (tab.hidden) {
      return <React.Fragment key={tab.value} />
    }
    const buttonDefaultStyle: React.CSSProperties = { cursor: 'pointer', opacity: tab.disabled ? 0.25 : 1, pointerEvents: tab.disabled ? 'none' : 'unset' }
    const buttonStyle: React.CSSProperties = orientation === 'vertical'
      ? buttonDefaultStyle
      : {
        ...buttonDefaultStyle,
        background: isSelected ? 'var(--section-bg)' : 'var(--root-bg)',
        border: `solid 2px ${isSelected ? 'var(--primary)' : 'transparent'}`,
        borderBottom: isSelected ? 'solid 2px var(--section-bg)' : '',
        borderLeft: isSelected ? 'solid 2px var(--section-bg)' : '',
        color: 'var(--text-color)',
        borderRadius: '0px',
        borderTopRightRadius: isSelected ? '5px' : '0px',
        transform: isSelected ? 'translateY(-2px)' : '',
        transition: 'all 0.3s ease-in-out',
      }

    return (
      <Button
        key={value}
        block={orientation === 'vertical'}
        data-orientation={orientation}
        data-disabled={tab.disabled}
        id={`tab-${value} `}
        type="button"
        onClick={() => (tab.disabled ? '' : setCurrentTab(tab))}
        style={buttonStyle}
        color={buttonColor}
      >
        {icon && (
          <Grid gap={10} horizontalAlgin="flex-start" verticalAlgin="center">
            {icon}
            {label}
          </Grid>
        )}
        {!icon && <Grid>{label}</Grid>}
      </Button>
    )
  }
  const theme = useThemeWatcher()

  return (
    <Grid>
      <Card
        color={color || (orientation === 'vertical' ? 'root' : 'section')}
        padding={orientation === 'vertical' ? ['p-2'] : []}
        style={{
          borderRadius: orientation === 'vertical' ? '' : '0px',
        }}
      >
        {header && <Grid padding={['pb-3']}>{header}</Grid>}
        <Grid gap={orientation === 'vertical' ? '0.5rem' : ''}>
          {tabs.map((t) => renderTab(t, theme as string))}
        </Grid>
      </Card>
    </Grid>
  )
}

export default TabSelector
