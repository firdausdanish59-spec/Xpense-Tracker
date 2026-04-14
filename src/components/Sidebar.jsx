import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ReceiptText, 
  PieChart, 
  BarChart3, 
  Repeat, 
  Users, 
  Target, 
  Settings,
  Coins,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useBreakpoint } from '../hooks/useBreakpoint';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, gradient: 'var(--gradient-1)', color: '#667EEA' },
  { path: '/transactions', label: 'Transactions', icon: ReceiptText, gradient: 'var(--gradient-2)', color: '#F5576C' },
  { path: '/budget', label: 'Budget', icon: PieChart, gradient: 'var(--gradient-3)', color: '#4FACFE' },
  { path: '/analytics', label: 'Analytics', icon: BarChart3, gradient: 'var(--gradient-4)', color: '#43E97B' },
  { path: '/subscriptions', label: 'Subscriptions', icon: Repeat, gradient: 'var(--gradient-5)', color: '#FA709A' },
  { path: '/split', label: 'Split', icon: Users, gradient: 'var(--gradient-6)', color: '#A18CD1' },
  { path: '/goals', label: 'Goals', icon: Target, gradient: 'var(--gradient-1)', color: '#667EEA' },
];

const Sidebar = ({ isMobileOpen, setMobileOpen }) => {
  const { user, logout } = useAuth();
  const { userProfile } = useData();
  const { isTablet } = useBreakpoint();

  const handleLogout = async () => {
    try {
      await logout();
      console.log("Logged out successfully.");
    } catch (e) {
      console.error("Logout error:", e);
    }
  };
  
  return (
    <>
      <AnimatePresence>
      {isMobileOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 40 }}
        />
      )}
      </AnimatePresence>
      
      <aside 
        style={{
          width: isTablet ? '72px' : '260px',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-color)',
          position: isMobileOpen ? 'fixed' : 'sticky',
          top: 0,
          left: 0,
          overflow: 'hidden',
          transition: 'width 0.3s ease'
        }}
      >
        {/* Subtle left glow */}
        <div style={{ position: 'absolute', left: 0, top: '30%', width: '2px', height: '40%', background: 'var(--gradient-1)', filter: 'blur(4px)', opacity: 0.5 }} />

        {/* Logo */}
        <div style={{ padding: isTablet ? '1rem' : '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', justifyContent: isTablet ? 'center' : 'flex-start' }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '12px', background: 'var(--gradient-1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
            flexShrink: 0
          }}>
            <Coins size={22} />
          </div>
          {!isTablet && (
            <span style={{ 
              fontSize: '1.4rem', fontFamily: 'var(--font-heading)', fontWeight: 800, letterSpacing: '-0.02em',
              background: 'var(--gradient-1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
              Xpense
            </span>
          )}
        </div>

        {/* Nav Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, padding: '0 0.75rem', overflowY: 'auto' }}>
          {NAV_ITEMS.map(({ path, label, icon: Icon, gradient, color }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setMobileOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.7rem 0.75rem', borderRadius: '12px', textDecoration: 'none',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(102, 126, 234, 0.08)' : 'transparent',
                borderLeft: isActive ? `3px solid ${color}` : '3px solid transparent',
                transition: 'all 0.2s ease',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                position: 'relative'
              })}
            >
              {({ isActive }) => (
                <>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '10px',
                    background: isActive ? gradient : `rgba(${hexToRgb(color)}, 0.1)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}>
                    <Icon size={18} color={isActive ? 'white' : color} />
                  </div>
                  {!isTablet && (
                    <span style={isActive ? { background: gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : {}}>
                      {label}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: Settings + User */}
        <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
          <NavLink
            to="/settings"
            onClick={() => setMobileOpen(false)}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.7rem 0.75rem', borderRadius: '12px', textDecoration: 'none',
              color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
              background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent',
              fontWeight: 500, fontSize: '0.9rem', marginBottom: '0.75rem'
            })}
          >
            {({ isActive }) => (
              <>
                <div style={{ 
                  width: '34px', height: '34px', borderRadius: '10px', 
                  background: 'rgba(255,255,255,0.06)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0 
                }}>
                  <Settings size={18} color="var(--text-muted)" />
                </div>
                {!isTablet && "Settings"}
              </>
            )}
          </NavLink>
          
          <div className="user-card" style={{ 
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem',
            background: 'rgba(255,255,255,0.03)', borderRadius: '12px', justifyContent: isTablet ? 'center' : 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="avatar"
                  style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid var(--gradient-1)', flexShrink: 0 }} 
                />
              ) : (
                <div style={{ 
                  width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gradient-1)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0
                }}>
                  {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              {!isTablet && (
                <div style={{ overflow: 'hidden' }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {userProfile?.name || user?.displayName || 'User'}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {user?.email}
                  </p>
                </div>
              )}
            </div>
            {!isTablet && (
              <button 
                onClick={handleLogout} 
                title="Logout"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', display: 'flex' }} 
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

// Helper to convert hex to rgb
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '102, 126, 234';
}

export default Sidebar;
