import { Bell } from 'lucide-react';

export const PageHeader = ({ title, actions, subtitle }) => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'flex-start',
      marginBottom: '2rem',
      gap: '1rem',
      flexWrap: 'wrap'
    }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', margin: '0 0 0.5rem 0', fontFamily: 'var(--font-heading)', fontWeight: 800 }}>{title}</h1>
        {subtitle && <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>{subtitle}</p>}
        {/* Gradient underline accent */}
        <div style={{ width: '48px', height: '3px', background: 'var(--gradient-1)', borderRadius: '2px', marginTop: '0.75rem' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {actions}
        <button style={{ 
          background: 'var(--bg-card)', 
          border: '1px solid var(--border-color)',
          borderRadius: '50%',
          width: '44px', height: '44px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}>
          <Bell size={20} />
        </button>
      </div>
    </div>
  );
};
