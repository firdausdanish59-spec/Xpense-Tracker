import { forwardRef } from 'react';

export const Input = forwardRef(({ className = '', label, error, ...props }, ref) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
      {label && (
        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </label>
      )}
      <input 
        ref={ref}
        className={`input-base ${className}`}
        style={{ width: '100%' }}
        {...props}
      />
      {error && (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-expense)' }}>{error}</span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
