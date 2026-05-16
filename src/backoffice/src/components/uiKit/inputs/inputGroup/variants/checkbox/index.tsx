import React, { ChangeEventHandler, HTMLInputTypeAttribute } from 'react'
import Typography from 'components/uiKit/typography'
import styles from './input.group.module.scss'

interface Props {
    label: string | undefined | any,
    value?: string | ReadonlyArray<string> | number | undefined | boolean,
    name: string,
    id: string,
    onChange?: ChangeEventHandler<HTMLInputElement> | undefined;
    onFocus?: React.FocusEventHandler<HTMLInputElement> | undefined;
    status?: 'error' | 'success' | 'warning' | 'info' | ''
    inputProps?: React.HTMLProps<HTMLInputElement>,
    feedback?: React.ReactNode,
    styles?: React.CSSProperties,
    noEditTranslation?: boolean
}
export default function Checkbox(props: Props) {
    const {
        label,
        value,
        name,
        id,
        onChange,
        onFocus,
        status,
        inputProps,
        feedback,
        styles: stylesProps,
        noEditTranslation,
    } = props

    function handleToggle(e: React.ChangeEvent<HTMLInputElement>) {
        if (onChange) {
            onChange({
                ...e,
                target: {
                    ...e.target, name, id, value: !value as any,
                },
            })
        }
    }

    return (
        <div
            data-status={status}
            className={styles['checkbox-input']}
            style={{ ...stylesProps }}
        >
            <input
                checked={value as any}
                onChange={(e) => handleToggle(e)}
                onFocus={onFocus}
                type="checkbox"
                placeholder={label}
                name={name}
                id={id}
                {...inputProps}
            />
            <div className={styles['check-label']}>
                {
                    typeof label === 'string' && !noEditTranslation
                        ? (
                            <Typography
                                translateGroup="input-group-label"
                                translateKey={label}
                                size="sm"
                            />
                        )
                        : label
                }
            </div>
            {
                feedback && (
                    <div className={styles.feedback}>
                        <Typography size="xsm">
                            {feedback}
                        </Typography>
                    </div>
                )
            }
        </div>
    )
}
