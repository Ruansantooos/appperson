import React from 'react';

interface LogoProps {
    className?: string;
    size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 32 }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <defs>
                <linearGradient id="logo_gradient" x1="0" y1="32" x2="32" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#0EA5E9" />
                    <stop offset="100%" stopColor="#c1ff72" />
                </linearGradient>
            </defs>
            {/* Outer C shape */}
            <path
                d="M26 16C26 21.5228 21.5228 26 16 26C10.4772 26 6 21.5228 6 16C6 10.4772 10.4772 6 16 6C18.5 6 20.8 6.9 22.5 8.5"
                stroke="url(#logo_gradient)"
                strokeWidth="6"
                strokeLinecap="round"
            />
            {/* Inner dot */}
            <circle cx="16" cy="16" r="3" fill="url(#logo_gradient)" />
        </svg>
    );
};
