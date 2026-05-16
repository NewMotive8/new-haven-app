import Grid from 'components/uiKit/grid';
import RangeInput, { RangeInputProps } from 'components/uiKit/inputs/inputGroup/variants/rangeInput';
import Typography from 'components/uiKit/typography';
import React, { useState } from 'react';



interface RangeArrayInputProps {
    id: string;
    name: string;
    label?: string;
    value: string;
    onChange?: (newValue: string) => void;
    inputProps: RangeInputProps
}

export function RangeArrayInput({
    id,
    name,
    label,
    value,
    onChange,
    inputProps,
}: RangeArrayInputProps): JSX.Element {
    const parseValue = (val: string): number[] => {
        try {
            return JSON.parse(val);
        } catch {
            return [];
        }
    };

    const stringifyValue = (arr: number[]): string => JSON.stringify(arr);


    const arrayValue = parseValue(value)

    const handleInputChange = (index: number, newValue: number) => {
        const updatedArray = [...arrayValue];
        updatedArray[index] = newValue;
        const newStringValue = stringifyValue(updatedArray);
        if (onChange) onChange(newStringValue);
    };



    return (
        <Grid>
            <Grid>
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
            <Grid gap='0.5rem'>
                {arrayValue.map((boolValue, index) => (
                    <Grid width={'100px'} key={index}>
                        <RangeInput
                            {...inputProps}
                            id={`${id}-${index}`}
                            name={`${name}[${index}]`}
                            value={boolValue}
                            onChange={(e) => handleInputChange(index, parseFloat(e.target.value))}
                            label={''}
                        />
                    </Grid>
                ))}
            </Grid>
        </Grid>
    );
}
