import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import Button from 'components/uiKit/buttons'
import { useRef } from 'react'
import styles from './input.group.module.scss'

export default function InputFile(props: any) {
  const {
    label,
    value,
    name,
    id,
    inputType: inputTypeProps,
    onChange,
    onFocus,
    status,
    inputProps,
    feedback,
    styles: stylesProps,
    noEditTranslation,
    fontSize,
  } = props
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <Grid>
      <Grid className={styles['animated-label']}>
        {typeof label === 'string' ? (
          <Typography
            translateGroup="input-group-label"
            translateKey={label}
            size="sm"
          />
        ) : (
          label
        )}
      </Grid>
      <Grid gap="0.5rem">
        <input
          type="file"
          name={name}
          id={id}
          accept=".csv"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={onChange}
        />
        <Button id="add-file" onClick={handleButtonClick} color="primary">
          <Typography
            translateGroup="input-file-label"
            translateKey="select-file"
            size="md"
            weight={600}
          />
        </Button>
        {value?.name ? (
          <span>{value?.name}</span>
        ) : (
          <span style={{ color: 'gray' }}>
            <Typography
              translateGroup="input-file-placeholder"
              translateKey="name-file"
              size="md"
              weight={400}
            />
          </span>
        )}
        <div
          data-status={status}
          data-font-size={fontSize || 'sm'}
          className={styles['input-group-wrapper']}
          style={{ ...stylesProps }}
        >
          {feedback && (
            <div className={styles.feedback}>
              <Typography size="xsm">{feedback}</Typography>
            </div>
          )}
        </div>
      </Grid>
    </Grid>
  )
}
