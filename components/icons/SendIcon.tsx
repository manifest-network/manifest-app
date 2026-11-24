import React from 'react';
import { SVGProps } from 'react';

export const SendIcon: React.FC<SVGProps<SVGSVGElement>> = props => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect width="24" height="24" rx="4" className="fill-error" fillOpacity="0.06" />
    <rect
      x="0.5"
      y="0.5"
      width="23"
      height="23"
      rx="3.5"
      className="stroke-error"
      strokeOpacity="0.12"
    />
    <path
      d="M9.97422 7.73721C9.55312 7.73721 9.25234 8.05439 9.25234 8.43174C9.25234 8.80361 9.56953 9.09893 9.96328 9.09893H11.9703L14.0156 9.02783L13.0422 9.89189L8.02734 14.9122C7.87969 15.0599 7.79766 15.2458 7.79766 15.4263C7.79766 15.7927 8.13672 16.1372 8.51406 16.1372C8.69453 16.1372 8.875 16.0606 9.02266 15.9075L14.043 10.8927L14.9125 9.91924L14.8305 11.888V13.9716C14.8305 14.3653 15.1258 14.688 15.5086 14.688C15.8859 14.688 16.2031 14.3708 16.2031 13.9606L16.1977 8.47549C16.1977 8.03799 15.9078 7.73721 15.4594 7.73721H9.97422Z"
      className="fill-error"
    />
  </svg>
);
