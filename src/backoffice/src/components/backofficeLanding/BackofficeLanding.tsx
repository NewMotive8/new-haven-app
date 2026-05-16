import React from 'react'
import { FaRocket, FaCog } from 'react-icons/fa'
import Typography from 'components/uiKit/typography'
import styles from './BackofficeLanding.module.scss'

const BackofficeLanding: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.badge}>
        <FaRocket size={32} />
        Engagd Backoffice
        <FaCog size={32} />
      </div>

      <Typography
        elementType="p"
        translateGroup="backoffice-home"
        translateKey="noDefaultPage"
        size="normal"
        color="var(--info)"
      />
    </div>
  )
}

export default BackofficeLanding
