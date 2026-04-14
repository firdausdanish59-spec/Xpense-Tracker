import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Eye, EyeOff, Layout, Zap, Target, Check } from 'lucide-react';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  
  const { register, loginWithGoogle, error } = useAuth();
  const navigate = useNavigate();

  const getStrength = (pass) => {
    if (!pass) return { label: '', color: 'transparent', width: '0%', text: '' };
    if (pass.length < 6) 
      return { label: 'Weak', color: '#FC8181', width: '33%', text: 'Too short' };
    
    const hasNumber = /\d/.test(pass);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    
    if (pass.length < 8 || (!hasNumber && !hasSymbol)) 
      return { label: 'Medium', color: '#F6AD55', width: '66%', text: 'Add numbers/symbols' };
    
    return { label: 'Strong', color: '#48BB78', width: '100%', text: 'Perfect!' };
  };

  const strength = getStrength(password);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    if (!agreedToTerms) {
      setLocalError('Please agree to the terms');
      return;
    }
    
    setIsLoading(true);
    try {
      await register(name, email, password);
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
    <div style={{ minHeight: '100vh', display: 'flex', background: '#0A0A0F', color: 'white', overflow: 'hidden' }}>
      
      {/* Left Side (Same as Login) */}
      <div style={{ 
        flex: '0 0 40%', 
        background: 'var(--gradient-1)', 
        padding: '3rem', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(50px)' }} />
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <div style={{ width: '48px', height: '48px', background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'var(--gradient-1)', fontWeight: 900, fontSize: '1.5rem' }}>X</span>
            </div>
            <h1 style={{ fontSize: '2rem', margin: 0, fontWeight: 800 }}>Xpense</h1>
          </div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem' }}>Join the community.</h2>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: '300px' }}>Start tracking today and reach your financial goals with ease.</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div style={{ 
        flex: '1', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '2rem',
        background: '#0A0A0F',
        overflowY: 'auto'
      }}>
        <div style={{ maxWidth: '420px', width: '100%', padding: '2rem 0' }}>
          <header style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Create your account</h2>
            <p style={{ color: '#A0AEC0' }}>Fill in your details to get started</p>
          </header>

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(error || localError) && (
              <div style={{ padding: '0.8rem', background: 'rgba(252,129,129,0.1)', border: '1px solid rgba(252,129,129,0.2)', color: '#FC8181', borderRadius: '8px', fontSize: '0.85rem' }}>
                {error || localError}
              </div>
            )}
            
            <Input label="Full Name" placeholder="John Doe" required value={name} onChange={e => setName(e.target.value)} />
            <Input label="Email Address" type="email" placeholder="name@company.com" required value={email} onChange={e => setEmail(e.target.value)} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ position: 'relative' }}>
                <Input label="Password" type={showPassword ? "text" : "password"} placeholder="••••••••" required value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '38px', background: 'none', border: 'none', color: '#718096', cursor: 'pointer' }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {password && (
                <div style={{ marginTop: '0.25rem' }}>
                  <div style={{ height: '4px', width: '100%', background: '#2D3748', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: strength.width, background: strength.color, transition: 'all 0.3s' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '0.7rem', color: strength.color, fontWeight: 700, textTransform: 'uppercase' }}>{strength.label}</span>
                    <span style={{ fontSize: '0.7rem', color: '#718096' }}>{strength.text}</span>
                  </div>
                </div>
              )}
            </div>

            <Input label="Confirm Password" type="password" placeholder="••••••••" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />

            <label style={{ display: 'flex', gap: '0.75rem', cursor: 'pointer', userSelect: 'none', marginTop: '0.5rem' }}>
              <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
              <span style={{ fontSize: '0.85rem', color: '#A0AEC0' }}>I agree to the <Link to="/terms" style={{ color: 'var(--gradient-1)' }}>Terms and Privacy Policy</Link></span>
            </label>

            <Button type="submit" disabled={isLoading} style={{ width: '100%', padding: '0.875rem', fontWeight: 600, marginTop: '1rem' }}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0', color: '#4A5568' }}>
            <div style={{ flex: 1, height: '1px', background: '#2D3748' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: '#2D3748' }} />
          </div>

          <Button onClick={handleGoogleLogin} disabled={isLoading} variant="secondary" style={{ width: '100%', background: 'white', color: '#1A202C', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '0.875rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign up with Google
          </Button>

          <footer style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: '#A0AEC0' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--gradient-1)', fontWeight: 600, textDecoration: 'none' }}>Login</Link>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Register;
