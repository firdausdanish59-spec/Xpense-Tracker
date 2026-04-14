import { useState, useEffect } from 'react';

const OfflineBar = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      background: '#F6AD55',
      color: '#744210',
      textAlign: 'center',
      padding: '8px',
      fontSize: 13,
      fontWeight: 600,
      zIndex: 99999
    }}>
      ⚠️ You are offline — showing cached data
    </div>
  );
};

export default OfflineBar;
