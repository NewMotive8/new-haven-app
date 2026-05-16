import React from 'react'

export default function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            width={42}
            height={42}
            viewBox="0 0 42 42"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <g clipPath="url(#clip0_143_1514)">
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M42.0004 42.0001C19.997 39.4633 2.53697 22.0034 0 0H34.0004C38.4187 0 42.0004 3.58172 42.0004 8V42.0001Z"
                    fill="url(#paint0_linear_143_1514)"
                />
                <path
                    d="M32 10.41L30.59 9L25 14.59L19.41 9L18 10.41L23.59 16L18 21.59L19.41 23L25 17.41L30.59 23L32 21.59L26.41 16L32 10.41Z"
                    fill="var(--text-color)"
                />
            </g>
            <defs>
                <linearGradient
                    id="paint0_linear_143_1514"
                    x1={39}
                    y1="3.5"
                    x2="-7.1134e-08"
                    y2={21}
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="var(--secondary)" />
                    <stop offset={1} stopColor="var(--secondary)" />
                </linearGradient>
                <clipPath id="clip0_143_1514">
                    <rect width={42} height={42} fill="var(--text-color)" />
                </clipPath>
            </defs>
        </svg>

    )
}
