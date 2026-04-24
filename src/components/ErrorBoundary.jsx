import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          background: '#1a1a2e',
          color: '#ff6b6b',
          fontFamily: 'monospace',
          minHeight: '100vh',
          whiteSpace: 'pre-wrap',
          overflow: 'auto'
        }}>
          <h1 style={{ color: '#ff6b6b', fontSize: '1.5rem' }}>⚠️ App Crashed</h1>
          <p style={{ color: '#ffffffcc', fontSize: '1rem', margin: '1rem 0' }}>
            <strong>Error:</strong> {this.state.error?.toString()}
          </p>
          <details open style={{ color: '#ffffff99', fontSize: '0.85rem' }}>
            <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>Stack Trace</summary>
            <pre>{this.state.error?.stack}</pre>
          </details>
          <details open style={{ color: '#ffffff99', fontSize: '0.85rem', marginTop: '1rem' }}>
            <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>Component Stack</summary>
            <pre>{this.state.errorInfo?.componentStack}</pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '2rem',
              padding: '0.75rem 1.5rem',
              background: '#667EEA',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
