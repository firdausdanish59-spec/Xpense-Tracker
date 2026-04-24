import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Global error handler so uncaught errors show visibly
window.addEventListener('error', (e) => {
  document.getElementById('root').innerHTML = `
    <div style="padding:2rem;background:#1a1a2e;color:#ff6b6b;font-family:monospace;min-height:100vh;">
      <h1>⚠️ Uncaught Error</h1>
      <pre style="color:#ffffffcc;white-space:pre-wrap">${e.message}\n${e.filename}:${e.lineno}</pre>
    </div>`;
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

// Service Worker: only register in production, unregister in dev
if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    // In development, unregister any existing service workers
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(reg => {
        reg.unregister();
        console.log('SW unregistered (dev mode):', reg.scope);
      });
    });
    // Also clear all caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
      console.log('All caches cleared (dev mode)');
    }
  } else {
    // Production only
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(reg => {
          console.log('SW registered:', reg.scope);
        })
        .catch(err => {
          console.log('SW registration failed:', err);
        });
    });
  }
}
