import React from 'react';

export const PiggyBankIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor" 
        {...props}
    >
        <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" 
        />
        <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M12 12.75h.008v.008H12v-.008zM12 9.75h.008v.008H12V9.75z" 
        />
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.5 6.375A2.625 2.625 0 1112.75 6.375a.75.75 0 00-1.5 0 1.125 1.125 0 00-2.25 0 .75.75 0 00-1.5 0zM12 21.75a2.25 2.25 0 002.25-2.25H9.75A2.25 2.25 0 0012 21.75z"
        />
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.375 19.5c.995 0 1.875-.505 2.454-1.252h12.342c.579.747 1.459 1.252 2.454 1.252"
        />
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 14.25a3.375 3.375 0 01-3.375 3.375h-1.75a3.375 3.375 0 01-3.375-3.375V12.75c0-1.864 1.51-3.375 3.375-3.375h1.75c1.864 0 3.375 1.511 3.375 3.375v1.5z"
        />
    </svg>
);