import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ReceiptText, Plus, Users, User } from 'lucide-react';
import { useBreakpoint } from '../hooks/useBreakpoint';

const BottomNav = ({ onAddClick }) => {
  const { isMobile } = useBreakpoint();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (!isMobile) return null;

  const tabs = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: ReceiptText, label: 'Trans', path: '/transactions' },
    { icon: Plus, label: 'Add', isAdd: true },
    { icon: Users, label: 'Split', path: '/split' },
    { icon: User, label: 'Me', path: '/settings' },
  ];

  return (
    <nav className="bottom-nav" style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}>
      {tabs.map((tab, i) =>
        tab.isAdd ? (
          <div key="add" className="bottom-nav-item" style={{ position: 'relative', overflow: 'visible' }}>
            <div 
              className="bottom-nav-add" 
              onClick={(e) => {
                e.stopPropagation();
                onAddClick();
              }}
              style={{ 
                boxShadow: '0 4px 20px rgba(102,126,234,0.5)',
                cursor: 'pointer',
                zIndex: 2000 
              }}
            >
              <Plus size={28} strokeWidth={2.5} />
            </div>
          </div>
        ) : (
          <div
            key={tab.path}
            className={`bottom-nav-item ${pathname === tab.path ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}
            style={{ padding: '0.5rem 0', cursor: 'pointer' }}
          >
            <tab.icon size={22} />
            <span style={{ fontSize: '0.7rem', marginTop: '4px' }}>{tab.label}</span>
          </div>
        )
      )}
    </nav>
  );
};

export default BottomNav;
