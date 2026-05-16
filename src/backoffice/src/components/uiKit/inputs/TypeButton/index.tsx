import React, { FocusEventHandler } from 'react'
import Button from 'components/uiKit/buttons'
import { useThemeWatcher } from 'utils/customHooks'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import { gridBaseProps } from 'components/uiKit/grid/types'
import InfoHover from '../../InfoHover'

export type btn = { value: any; label: any; info?: any, customActiveCheck?: (value: any) => boolean };
interface OCI {
    target: {
        name: string;
        id: string;
        value: any;
    };
}
interface props {
    value: any;
    onChange: (item: OCI) => void;
    onFocus?: FocusEventHandler<HTMLDivElement> | undefined;
    name: string | any;
    options: Array<btn>;
    className?: any;
    readOnly?: any;
    status?: 'error' | 'success' | 'warning' | 'info' | '';
    feedback?: React.ReactNode;
    label?: React.ReactNode;
    orientation?: 'vertical' | 'horizontal';
    gridProds?: gridBaseProps,
}

function TypeButton({
    value,
    onChange,
    name,
    options,
    className,
    readOnly,
    status,
    feedback,
    label,
    onFocus,
    orientation = 'horizontal',
    gridProds,
}: props) {
    const theme = useThemeWatcher()
    const statusColors: any = {
        error: 'var(--danger)',
        info: 'var(--info)',
        success: 'var(--success)',
        warning: 'var(--warning)',
    }

    const textColor = (status && statusColors[status]) || 'var(--text-color)'
    return (
        <Grid
            className={className}
            onFocus={onFocus}
            padding={orientation === 'vertical' ? ['pe-1', 'ps-1'] : []}
            style={orientation === 'vertical' ? { flexDirection: 'column' } : {}}
        >
            {
                label && (
                    <Grid style={{ transform: 'translateY(-30%)' }}>
                        {
                            typeof label === 'string'
                                ? (
                                    <Typography
                                        translateGroup="input-group-label"
                                        translateKey={label}
                                        color={textColor}
                                        weight={600}
                                    />
                                )
                                : label
                        }
                    </Grid>
                )
            }
            <Grid gap="0.5rem">
                {options.map((btn: any) => {
                    if (btn.hidden) return null
                    const active = value?.toString() === btn?.value?.toString() || (btn?.customActiveCheck && btn?.customActiveCheck(value))
                    const btnColor = theme === 'light'
                        ? active ? 'primary-full' : 'primary'
                        : active ? 'primary' : 'primary-full'
                    return (
                        <Button
                            key={btn.value}
                            id={btn.name}
                            disabled={readOnly || btn?.disabled}
                            onClick={() => { onChange({ target: { name, id: name, value: btn.value } }) }}
                            type="button"
                            color={btnColor}
                            style={orientation === 'vertical' ? { width: '100%' } : {}}
                        >
                            <Grid horizontalAlgin="center">
                                <b>
                                    {' '}
                                    {btn.label}
                                </b>
                                {
                                    btn?.info
                                        ? <InfoHover content={btn?.info} />
                                        : <></>
                                }
                            </Grid>
                        </Button>
                    )
                })}
            </Grid>
            {
                feedback && (
                    <Grid>
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

export default TypeButton
