import { forwardRef } from 'react';

export const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  gradient,
  className = '', 
  style = {}, 
  ...props 
}, ref) => {
  const base = variant === 'primary' ? 'btn-primary' : 'btn-secondary';
  
  const gradientStyle = gradient ? { background: gradient } : {};

  return (
    <button 
      ref={ref}
      className={`${base} ${className}`}
      style={{ ...gradientStyle, ...style }}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';
