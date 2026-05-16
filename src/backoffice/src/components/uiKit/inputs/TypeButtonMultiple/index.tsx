import React, { ReactNode } from 'react'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import InfoHover from 'components/uiKit/InfoHover'

type btn = { value: any, label: ReactNode, info?: ReactNode }
interface props {
    value: Array<any>,
    onChange: Function,
    name: string | any,
    options: Array<btn>,
    className?: any,
    readOnly?: any
}

function TypeButtonMultiple({
    value, onChange, name, options, className, readOnly,
}: props) {
    function updateValues(buttonValue: any) {
        const findIndex = value?.findIndex((v: any) => v === buttonValue)
        const newValue = [...value]
        if (findIndex > -1) {
            delete newValue[findIndex]
        } else {
            newValue.push(buttonValue)
        }
        return onChange({ target: { value: newValue.filter((v) => v) } })
    }

    return (
        <div style={{
            width: '100%',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
        }}
        >
            {options.map((btn: any) => {
                const active = value?.includes(btn?.value?.toString())
                return (
                    <div key={btn.value} className={className}>
                        <Button
                            id="btn-multiple"
                            disabled={readOnly}
                            onClick={() => { updateValues(btn.value) }}
                            type="button"
                            style={className ? { width: '100%' } : { marginRight: '15px', marginBottom: '15px' }}
                            color={active ? 'primary' : 'disabled'}
                        >
                            <Grid horizontalAlgin="center" verticalAlgin="center">
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
                    </div>
                )
            })}
        </div>
    )
}

export default TypeButtonMultiple
