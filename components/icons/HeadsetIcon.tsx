import React from 'react';

export const HeadsetIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor" 
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5a6 6 0 00-6-6.75v1.5a4.5 4.5 0 11-4.5 4.5v-1.5a6 6 0 006-6.75V18.75z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6.75v-1.5a6 6 0 10-9 6v1.5a6 6 0 009-6zM15.75 6.75h.008v.008h-.008V6.75z" />
    </svg>
);
