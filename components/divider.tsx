import React from 'react';

const Divider = ({ direction }: { direction: 'up' | 'down' }) => {
  const lines = Array.from({ length: 50 }, (_, i) => {
    const y = i * 2; // Vertical position of each line
    const width = 100 - i * 2; // Decrease width as we go down
    return (
      <line
        key={i}
        x1={`${50 - width / 2}%`}
        y1={`${y}%`}
        x2={`${50 + width / 2}%`}
        y2={`${y}%`}
        stroke="currentColor"
        strokeWidth="1"
        opacity={`${1 - i / 50}`} // Optional: fade out towards the bottom
      />
    );
  });

  return (
    <div
      className={`w-full overflow-hidden leading-none ${direction === 'up' ? 'rotate-180' : ''}`}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-24 text-content-muted"
      >
        {lines}
      </svg>
    </div>
  );
};

export default Divider;
