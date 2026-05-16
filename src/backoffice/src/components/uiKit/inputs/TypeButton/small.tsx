import React from 'react'

function TypeButton({
    value, onChange, name, options, className, readOnly,
}: any) {
    return (
        <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap' }}>
            {options.map((btn: any) => {
                return (
                    <div key={btn.value} className={className}>
                        <button
                            disabled={readOnly}
                            onClick={() => { onChange({ target: { name, id: name, value: btn.value } }) }}
                            type="button"
                            style={className ? { width: '100%' } : { marginRight: '15px', marginBottom: '15px' }}
                            className={`btn  ${value?.toString() === btn?.value?.toString() ? 'btn-info btn-sm' : 'btn-secondary btn-sm'} `}
                        >
                            <b>
                                {' '}
                                {btn.label}
                            </b>
                        </button>
                    </div>
                )
            })}
        </div>
    )
}

export default TypeButton
