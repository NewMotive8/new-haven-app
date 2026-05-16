import React from 'react'

interface Props extends React.SVGProps<SVGSVGElement> {
    isDisabled?: boolean,
}

export default function PrevArrow({ isDisabled, ...props }: Props) {
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
                x={40}
                y={40}
                width={40}
                height={40}
                rx={10}
                transform="rotate(-180 40 40)"
                fill="var(--secondary)"
            />
            <path
                d="M22.5 26.25L16.25 20L22.5 13.75"
                stroke={isDisabled ? '#ffffff60' : '#fff'}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}
