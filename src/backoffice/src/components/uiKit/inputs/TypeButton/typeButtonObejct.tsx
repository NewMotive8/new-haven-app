import React from 'react'

function TypeButtonObject({
    value, onChange, name, options, className, readOnly, id,
}: any) {
    return (
        <div style={{ width: '100%', display: 'block', flexWrap: 'wrap' }}>
            {options.map((btn: any) => {
                return (
                    <div key={btn.value} className={className}>
                        <button
                            disabled={readOnly}
                            onClick={() => { onChange({ target: { name, id: name, value: btn.value } }) }}
                            type="button"
                            style={className ? { width: '100%' } : { marginRight: '15px', marginBottom: '15px' }}
                            className={`btn  ${value[id]?.toString() === btn?.value[id]?.toString() ? 'btn-info btn-lg' : 'btn-secondary btn-lg'} `}
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

export default TypeButtonObject
