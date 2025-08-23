import React from 'react';

export const TelegramIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor"
        {...props}
    >
        <path d="M11.693 15.36l-2.43-2.033-3.23.992c-.52.16-1.033-.34- .82-.853l1.83-4.522c.16-.4.59-.63.99-.54l8.32 2.3c.5.14.71.74.32 1.13l-3.5 3.5c-.31.31-.83.2-1.02-.19V15.36z" />
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
    </svg>
);
