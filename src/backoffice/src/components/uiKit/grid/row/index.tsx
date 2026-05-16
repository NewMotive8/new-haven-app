import React from 'react'

export interface Props extends React.HTMLProps<HTMLDivElement> {
    children: React.ReactNode,
}

export default function Row({
    style, children, className, ...nProps
}: Props) {
    return (
        <div
            className={className && className}
            style={{ width: '100%', ...style }}
            {...nProps}
        >
            {children}
        </div>
    )
}
