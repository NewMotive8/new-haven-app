// components/uiKit/fullPageSpinner.tsx
import React from 'react'

interface FullPageSpinnerProps {
    show: boolean
}

const FullPageSpinner: React.FC<FullPageSpinnerProps> = ({ show }) => {
    if (!show) return null

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                zIndex: 99999,
                pointerEvents: 'auto',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <div
                style={{
                    border: '10px solid #f3f3f3',
                    borderTop: '10px solid #3498db',
                    borderRadius: '50%',
                    width: '110px',
                    height: '110px',
                    animation: 'spin 1s linear infinite',
                    pointerEvents: 'none',
                }}
            />
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}

export default FullPageSpinner
