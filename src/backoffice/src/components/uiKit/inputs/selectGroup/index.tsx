import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import React, { FocusEventHandler, ReactNode } from 'react'
import Select, { createFilter } from 'react-select'
import styles from './style.module.scss'

type selectItem = {
    value: any,
    label: ReactNode
}

interface Props {
    id: string,
    name: string,
    label?: string,
    value: any,
    options: Array<selectItem>,
    placeholder?: ReactNode,
    onChange: (props: any) => void,
    onFocus?: FocusEventHandler<HTMLDivElement> | undefined,
    status?: 'error' | 'success' | 'warning' | 'info' | '',
    feedback?: React.ReactNode,
}

export default function SelectGroup(props: Props) {
    const {
        value, options, onChange, id, name, label, placeholder,
        status, feedback, onFocus,
    } = props
    const statusColors: any = {
        error: 'var(--danger)',
        info: 'var(--info)',
        success: 'var(--success)',
        warning: 'var(--warning)',
    }

    const textColor = (status && statusColors[status]) || 'var(--text-color)'
    const filterConfig: any = {
        ignoreCase: true,
        ignoreAccents: true,
        trim: false,
        matchFrom: 'start',
    }
    return (
        <Grid onFocus={onFocus}>
            <Grid>
                {
                    label
                        ? typeof label === 'string'
                            ? (
                                <Typography
                                    translateGroup="input-group-label"
                                    translateKey={label}
                                    weight={600}
                                    color={textColor}
                                    style={{ transform: 'translateY(-5px)' }}
                                />
                            )
                            : label
                        : ''
                }
            </Grid>
            <Select
                value={value}
                options={options}
                placeholder={placeholder}
                filterOption={createFilter(filterConfig)}
                onChange={(e: selectItem) => onChange({ target: { id, name, value: e.value } })}
                classNamePrefix="group-select"
                className="group-select-container"
                theme={(theme) => ({
                    ...theme,
                    colors: {
                        ...theme.colors,
                        primary25: 'var(--option-hover-bg)',
                        primary50: 'var(--option-hover-bg)',
                        primary: 'var(--tertiary)',
                    },
                })}
            />
            {
                feedback && (
                    <Grid padding={['pt-2']}>
                        <Typography
                            size="xsm"
                            color={textColor}
                        >
                            {feedback}
                        </Typography>
                    </Grid>
                )
            }
        </Grid>
    )
}
