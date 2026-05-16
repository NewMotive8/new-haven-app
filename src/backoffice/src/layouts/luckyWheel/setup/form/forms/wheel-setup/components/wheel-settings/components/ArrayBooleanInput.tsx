import Grid from 'components/uiKit/grid';
import Toggle from 'components/uiKit/inputs/Toggle';
import Typography from 'components/uiKit/typography';
import React, { useState } from 'react';

interface BooleanArrayInputProps {
    id: string;
    name: string;
    label?: string;
    value: string;
    onChange?: (newValue: string) => void;
}

export function BooleanArrayInput({
    id,
    name,
    label,
    value,
    onChange,
}: BooleanArrayInputProps): JSX.Element {
    const parseValue = (val: string): boolean[] => {
        try {
            return JSON.parse(val);
        } catch {
            return [];
        }
    };

    const stringifyValue = (arr: boolean[]): string => JSON.stringify(arr);


    const arrayValue = parseValue(value)

    const handleInputChange = (index: number, newValue: boolean) => {
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
                        <Toggle
                            id={`${id}-${index}`}
                            name={`${name}[${index}]`}
                            value={boolValue}
                            onChange={(e) => handleInputChange(index, e.target.value)}
                            label={''}
                        />
                    </Grid>
                ))}
            </Grid>
        </Grid>
    );
}
