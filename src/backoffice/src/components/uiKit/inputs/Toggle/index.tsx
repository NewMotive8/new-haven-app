import React, { FocusEventHandler } from 'react'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import { BsInfoCircle } from 'react-icons/bs'
import styles from './styles.module.scss'

interface OCI {
  target: {
    name: string,
    id: string,
    value: any,
  }
}
interface Props {
  id: string;
  name: string;
  value: boolean;
  onChange: (item: OCI) => void,
  label: string | undefined | any;
  onFocus?: FocusEventHandler<HTMLDivElement> | undefined,
  displayInfo?: boolean | undefined
}
export default function Toggle(props: Props) {
  const {
    value, onChange, id, name, label, onFocus, displayInfo,
  } = props

  return (
    <Grid
      width="fit-content"
      className={styles.wrapper}
    >
      <Grid gap="0.5rem" className={styles.editTextLabel}>
        {typeof label === 'string' ? (
          <Typography
            translateGroup="input-group-label"
            translateKey={label}
            size="sm"
          />
        ) : (
          label
        )}
        {
          displayInfo && onFocus && (
            <Grid
              width="fit-content"
              onFocus={onFocus}
              onMouseEnter={() => onFocus && onFocus('' as any)}
            >
              <BsInfoCircle />
            </Grid>
          )
        }
      </Grid>
      <div
       onClick={() => {
  const newValue = !value // toggle the value
  onChange?.({ target: { id, name, value: newValue } })
}}
        className={value ? styles.active : styles.disabled}
      >
        <div
          className={styles.switch}
        />
      </div>
    </Grid>
  )
}