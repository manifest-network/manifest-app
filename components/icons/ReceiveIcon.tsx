import React from 'react';
import { SVGProps } from 'react';

export const ReceiveIcon: React.FC<SVGProps<SVGSVGElement>> = props => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect width="24" height="24" rx="4" className="fill-success" fillOpacity="0.06" />
    <rect
      x="0.5"
      y="0.5"
      width="23"
      height="23"
      rx="3.5"
      className="stroke-success"
      strokeOpacity="0.12"
    />
    <path
      d="M9.97422 16.2628C9.55312 16.2628 9.25234 15.9456 9.25234 15.5683C9.25234 15.1964 9.56953 14.9011 9.96328 14.9011H11.9703L14.0156 14.9722L13.0422 14.1081L8.02734 9.08779C7.87969 8.94014 7.79766 8.7542 7.79766 8.57373C7.79766 8.20732 8.13672 7.86279 8.51406 7.86279C8.69453 7.86279 8.875 7.93936 9.02266 8.09248L14.043 13.1073L14.9125 14.0808L14.8305 12.112V10.0284C14.8305 9.63467 15.1258 9.31201 15.5086 9.31201C15.8859 9.31201 16.2031 9.6292 16.2031 10.0394L16.1977 15.5245C16.1977 15.962 15.9078 16.2628 15.4594 16.2628H9.97422Z"
      className="fill-success"
    />
  </svg>
);
