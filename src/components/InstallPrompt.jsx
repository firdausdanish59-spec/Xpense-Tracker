import { useState, useEffect } from 'react';

const InstallPrompt = () => {
  const [prompt, setPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 80,
      left: 16,
      right: 16,
      background: 'var(--bg-card)',
      border: '1px solid rgba(102,126,234,0.3)',
      borderRadius: 16,
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      zIndex: 9998,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
    }}>
      <div style={{
        width: 44, height: 44,
        background: 'linear-gradient(135deg,#667EEA,#764BA2)',
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 22,
        flexShrink: 0
      }}>💰</div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 13, fontWeight: 600,
          color: 'var(--text-primary)'
        }}>
          Add Xpense to Home Screen
        </div>
        <div style={{
          fontSize: 11,
          color: 'var(--text-secondary)',
          marginTop: 2
        }}>
          Works like a real app, no App Store needed
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setVisible(false)}
          style={{
            background: 'none',
            border: '1px solid var(--border-color)',
            borderRadius: 8, padding: '6px 10px',
            fontSize: 12, cursor: 'pointer',
            color: 'var(--text-secondary)'
          }}
        >
          Later
        </button>
        <button
          onClick={handleInstall}
          style={{
            background: 'linear-gradient(135deg,#667EEA,#764BA2)',
            border: 'none',
            borderRadius: 8, padding: '6px 12px',
            fontSize: 12, cursor: 'pointer',
            color: 'white', fontWeight: 600
          }}
        >
          Install
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
