import React from 'react';

export const SkeletonLoader = () => (
  <div style={{ padding: 24 }}>
    {[1, 2, 3, 4].map(i => (
      <div key={i} style={{
        height: 80,
        borderRadius: 16,
        marginBottom: 12,
        animation: 'shimmer 1.5s infinite',
        background: 'linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-card) 50%, var(--bg-secondary) 75%)',
        backgroundSize: '200% 100%'
      }}/>
    ))}
    <style>{`
      @keyframes shimmer {
        0%   { background-position: 200% 0 }
        100% { background-position: -200% 0 }
      }
    `}</style>
  </div>
);

export default SkeletonLoader;
