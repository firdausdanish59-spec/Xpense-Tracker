import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Eye, EyeOff, Layout, Zap, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBreakpoint } from '../hooks/useBreakpoint';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, loginWithGoogle, error } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      // error handled in context
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      // error handled in context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: isMobile ? 'column' : 'row', 
      background: '#0A0A0F', 
      color: 'white', 
      overflow: isMobile ? 'auto' : 'hidden' 
    }}>
      
      {/* Left Side - Brand & Features */}
      <div style={{ 
        flex: isMobile ? 'none' : '0 0 40%', 
        background: 'var(--gradient-1)', 
        padding: isMobile ? '2rem' : '3rem', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated Orbs for Depth */}
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(50px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '-5%', width: '200px', height: '200px', background: 'rgba(0,0,0,0.15)', borderRadius: '50%', filter: 'blur(40px)' }} />

        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <div style={{ width: '48px', height: '48px', background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
              <span style={{ color: 'var(--gradient-1)', fontWeight: 900, fontSize: '1.5rem' }}>X</span>
            </div>
            <h1 style={{ fontSize: '2rem', margin: 0, fontWeight: 800, letterSpacing: '-0.02em' }}>Xpense</h1>
          </div>

          <h2 style={{ fontSize: isMobile ? '1.75rem' : '2.5rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem' }}>
            Track smarter.<br />Save better.
          </h2>

          {!isMobile && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '3rem' }}>
              {[
                { icon: <Zap size={20} />, text: "Track every rupee you spend" },
                { icon: <Layout size={20} />, text: "Split bills with friends instantly" },
                { icon: <Target size={20} />, text: "Reach your savings goals faster" }
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.1rem', fontWeight: 500, opacity: 0.9 }}>
                  <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: '8px' }}>{item.icon}</div>
                  {item.text}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Form (60%) */}
      <div style={{ 
        flex: '1', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '2rem',
        background: '#0A0A0F',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '420px', width: '100%' }}>
          <header style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Welcome back 👋</h2>
            <p style={{ color: '#A0AEC0' }}>Login to your Xpense account</p>
          </header>

          <Button 
            onClick={handleGoogleLogin}
            disabled={isLoading}
            variant="secondary"
            style={{ 
              width: '100%', 
              background: 'white', 
              color: '#1A202C', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.75rem',
              padding: '0.875rem',
              fontWeight: 600,
              border: 'none',
              marginBottom: '1.5rem'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </Button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0', color: '#4A5568' }}>
            <div style={{ flex: 1, height: '1px', background: '#2D3748' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>or email</span>
            <div style={{ flex: 1, height: '1px', background: '#2D3748' }} />
          </div>

          <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {error && (
              <div style={{ padding: '0.8rem', background: 'rgba(252,129,129,0.1)', border: '1px solid rgba(252,129,129,0.2)', color: '#FC8181', borderRadius: '8px', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}
            
            <Input 
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div style={{ position: 'relative' }}>
              <Input 
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '38px', background: 'none', border: 'none', color: '#718096', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div style={{ textAlign: 'right' }}>
              <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: '#A0AEC0', textDecoration: 'none' }}>Forgot password?</Link>
            </div>

            <Button type="submit" disabled={isLoading} style={{ width: '100%', padding: '0.875rem', fontWeight: 600 }}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <footer style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: '#A0AEC0' }}>
            Don't have an account? <Link to="/register" style={{ color: 'var(--gradient-1)', fontWeight: 600, textDecoration: 'none' }}>Sign up</Link>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Login;
