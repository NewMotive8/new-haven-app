import React from 'react'
import styles from './badge.module.scss'

export type BadgeProps = {
  text: string
  icon?: React.ReactNode
  iconColor?: string
  textColor?: string
  backgroundColor?: string
  className?: string
}

const Badge: React.FC<BadgeProps> = ({
  text,
  icon,
  iconColor,
  textColor,
  backgroundColor,
  className = '',
}) => {
  const style: React.CSSProperties = {
    ...(backgroundColor ? { '--badge-bg': backgroundColor } as any : {}),
    ...(textColor ? { '--badge-text': textColor } as any : {}),
    ...(iconColor ? { '--badge-icon': iconColor } as any : {}),
  }

  return (
    <div className={`${styles.badge} ${className}`} style={style}>
      {icon && (
        <span className={styles.iconWrapper}>
          {icon}
        </span>
      )}
      <span>{text}</span>
    </div>
  )
}

export default Badge
