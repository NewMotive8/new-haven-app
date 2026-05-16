import React from 'react'

export default function MustDropIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            width={50}
            height={50}
            viewBox="0 0 50 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <path d="M25 10V25L32 32" stroke="currentColor" strokeWidth={2} strokeMiterlimit={10} />
            <g fill="none">
                <path d="M34.35 47C40.033 44.617 44.525 40.033 47 34.35M15.65 3C9.967 5.383 5.383 9.967 3 15.65M25 5C19.6957 5 14.6086 7.10714 10.8579 10.8579C7.10714 14.6086 5 19.6957 5 25C5 30.3043 7.10714 35.3914 10.8579 39.1421C14.6086 42.8929 19.6957 45 25 45C30.3043 45 35.3914 42.8929 39.1421 39.1421C42.8929 35.3914 45 30.3043 45 25C45 19.6957 42.8929 14.6086 39.1421 10.8579C35.3914 7.10714 30.3043 5 25 5Z" stroke="currentColor" strokeWidth={2} strokeMiterlimit={10} />
            </g>
            <path d="M25 23C24.4696 23 23.9609 23.2107 23.5858 23.5858C23.2107 23.9609 23 24.4696 23 25C23 25.5304 23.2107 26.0391 23.5858 26.4142C23.9609 26.7893 24.4696 27 25 27C25.5304 27 26.0391 26.7893 26.4142 26.4142C26.7893 26.0391 27 25.5304 27 25C27 24.4696 26.7893 23.9609 26.4142 23.5858C26.0391 23.2107 25.5304 23 25 23Z" fill="currentColor" />
        </svg>
    )
}
