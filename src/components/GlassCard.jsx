export const GlassCard = ({ children, className = '', style = {}, hover = false, glow }) => {
  const glowStyle = glow ? { boxShadow: `0 0 40px ${glow}` } : {};
  return (
    <div 
      className={`glass-panel ${hover ? 'glass-panel-hover' : ''} ${className}`}
      style={{ padding: '1.5rem', ...glowStyle, ...style }}
    >
      {children}
    </div>
  );
};
