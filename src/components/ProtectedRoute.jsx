import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#0A0A0F',
      color: '#A0AEC0',
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif'
    }}>
      Loading Xpense...
    </div>
  );

  return user 
    ? children 
    : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
