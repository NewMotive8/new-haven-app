import React, { useEffect, useState } from 'react'
import Grid from 'components/uiKit/grid'
import InputGroup, { uiKitInputProps } from '../..' // Adjust the import path as needed
import styles from './input.group.module.scss'
export interface RangeInputProps {
    min: number;
    max: number;
    step: 0.01 | 0.1 | 1 | 0.05;
}
interface Props extends uiKitInputProps, RangeInputProps {
    min: number;
    max: number;
    step: 0.01 | 0.1 | 1 | 0.05;
}

function RangeInput({
    min, max, step, ...inputProps
}: Props) {
    const [value, setValue] = useState(inputProps.value)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputString = e.target.value
        const numericString = inputString.replace(/[^0-9.]/g, '')
        const newValue = numericString ? parseFloat(numericString) : ''
        setValue(newValue)
        if (inputProps.onChange) {
            inputProps.onChange(e)
        }
    }
 
    const hideSlider = inputProps.name === 'multiLevelWeight'
    
    useEffect(() => {
        if (inputProps.value !== value) {
            setValue(inputProps.value)
        }
    }, [inputProps.value])

    return (
        <Grid>
            <InputGroup
                {...inputProps}
                value={value}
                onChange={handleChange}
                inputType="number"
                inputProps={{
                    ...inputProps.inputProps,
                    min,
                    max,
                    step,
                }}
            />
            {!hideSlider && (
                 <input
                name={inputProps.name}
                id={inputProps.id}
                type="range"
                className={styles['range-slider']}
                min={min}
                max={max}
                step={step}
                value={value as number}
                onChange={handleChange}
                style={{
                    width: '100%',
                    marginTop: '10px',
                    pointerEvents: inputProps?.inputProps?.readOnly ? 'none' : 'unset',
                }}
            />
            )
            }
        </Grid>
    )
}

export default RangeInput
