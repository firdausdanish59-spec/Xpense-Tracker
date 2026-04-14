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
    <nav className="bottom-nav">
      {tabs.map((tab, i) =>
        tab.isAdd ? (
          <div key="add" className="bottom-nav-item" onClick={onAddClick}>
            <div className="bottom-nav-add">
              <Plus size={24} strokeWidth={2.5} />
            </div>
          </div>
        ) : (
          <div
            key={tab.path}
            className={`bottom-nav-item ${pathname === tab.path ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            <tab.icon size={20} />
            <span>{tab.label}</span>
          </div>
        )
      )}
    </nav>
  );
};

export default BottomNav;
