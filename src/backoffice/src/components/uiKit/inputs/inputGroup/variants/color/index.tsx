import React, { useState, useCallback } from 'react'
import Typography from 'components/uiKit/typography'
import styles from './input.group.module.scss'

interface Props {
    label: string,
    value?: string,
    name: string,
    id: string,
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    onFocus?: React.FocusEventHandler<HTMLInputElement>;
    status?: 'error' | 'success' | 'warning' | 'info' | '',
    inputProps?: React.HTMLProps<HTMLInputElement>,
    feedback?: React.ReactNode,
    styles?: React.CSSProperties,
    noEditTranslation?: boolean
}

function isValidHex(hex: string): boolean {
    return /^#([0-9A-F]{6}|[0-9A-F]{8})$/i.test(hex)
}

function ColorPicker({
    label, value = '#ffffffff', name, id, onChange, onFocus, status, inputProps, feedback, styles: stylesProps, noEditTranslation,
}: Props) {
    const [hexColor, setHexColor] = useState<string>(isValidHex(value) ? value : '#ffffffff')
    const [alpha, setAlpha] = useState<number>(parseInt(hexColor.slice(7, 9), 16) / 255)

    const handleColorChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const newHex = event.target.value
        if (isValidHex(newHex)) {
            setHexColor(newHex.slice(0, 7) + Math.round(alpha * 255).toString(16).padStart(2, '0'))
            if (onChange) {
                onChange({
                    ...event,
                    target: {
                        ...event.target,
                        name,
                        id,
                        value: newHex.slice(0, 7) + Math.round(alpha * 255).toString(16).padStart(2, '0'),
                    },
                } as any)
            }
        }
    }, [onChange, name, id, alpha])

    const handleAlphaChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const newAlpha = parseFloat(event.target.value)
        setAlpha(newAlpha)
        const newHex = hexColor.slice(0, 7) + Math.round(newAlpha * 255).toString(16).padStart(2, '0')
        console.log('newHex: ', newHex);
        setHexColor(newHex)
        if (onChange) {
            onChange({
                ...event,
                target: {
                    ...event.target,
                    name,
                    id,
                    value: newHex,
                },
            } as any)
        }
    }, [onChange, name, id, hexColor])

    return (
        <div
            data-status={status}
            className={styles['input-group-wrapper']}
            style={{ ...stylesProps }}
        >
            <label>
                <div className={styles['animated-label']}>
                    {typeof label === 'string' ? (
                        <Typography
                            translateGroup="input-group-label"
                            translateKey={label}
                            size="sm"
                        />
                    ) : (
                        label
                    )}
                </div>
                <input
                    value={hexColor.substring(0, 7)}
                    onChange={handleColorChange}
                    onFocus={onFocus}
                    placeholder={label}
                    name={name}
                    id={id}
                    {...inputProps}
                    type="color"
                />
                <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={alpha}
                        onChange={handleAlphaChange}
                        name={`${name}-alpha`}
                        id={`${id}-alpha`}
                        style={{ width: '30%' }}
                    />
                    <div style={{
                        background: hexColor,
                        height: '15px',
                        width: '100%',
                        border: 'solid 1px var(--input-border)',
                    }}
                    />
                </div>
            </label>
            {feedback && (
                <div className={styles.feedback}>
                    <Typography size="xsm">{feedback}</Typography>
                </div>
            )}
        </div>
    )
}

export default ColorPicker
