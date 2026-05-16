import React from 'react'

interface Props extends React.SVGProps<SVGSVGElement> {
    isDisabled?: boolean,
}

export default function NextArrow({ isDisabled, ...props }: Props) {
    return (
        <svg
            width={40}
            height={40}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <rect
            width={40}
            height={40}
            rx={10}
            fill="var(--secondary)"
            />
            <path
                d="M17.5 13.75 23.75 20l-6.25 6.25"
                stroke={isDisabled ? '#ffffff60' : '#fff'}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}
