import { buttonColors } from 'components/uiKit/buttons/types'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import React from 'react'
import { gridBaseProps } from 'components/uiKit/grid/types'
import { typographyProps } from 'components/uiKit/typography/types'
import styles from './styles.module.scss'

interface Props extends Omit<gridBaseProps, 'label' | 'value' | 'content'> {
  icon?: React.ReactNode;
  label: React.ReactNode;
  value?: React.ReactNode;
  content?: React.ReactNode;
  color?: buttonColors;
  contentProps?: typographyProps;
}

export default function InfoCard(props: Props) {
  const {
    icon,
    label,
    value,
    content,
    color,
    className,
    contentProps,
    ...cardProps
  } = props
  const info = value || content
  return (
    <Grid
      gap="1rem"
      data-color={color || 'primary'}
      className={`${styles.card} ${className || ''}`}
      padding={['p-3']}
      {...cardProps}
    >
      <Grid wrap="nowrap" gap="0.5rem" verticalAlgin="stretch">
        <Grid verticalAlgin="center">
          {typeof label === 'string' ? (
            <Typography
              translateGroup="infoCards"
              translateKey={label}
              weight={600}
              size="md"
            />
          ) : (
            label
          )}
        </Grid>
        {icon && (
          <Grid
            verticalAlgin="center"
            className={styles.icon}
            width="fit-content"
          >
            {icon}
          </Grid>
        )}
      </Grid>
      <Grid>
        {typeof info === 'string' ? (
          <Typography
            translateGroup="infoCards"
            translateKey={info}
            weight={800}
            size="md"
            {...contentProps}
          />
        ) : (
          info
        )}
      </Grid>
    </Grid>
  )
}
