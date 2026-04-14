import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Lock, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const { forgotPassword, error } = useAuth();

  const handleReset = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await forgotPassword(email);
      setEmailSent(true);
    } catch (err) {
      // error handled in context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A0F', padding: '1rem' }}>
      
      {/* Background Blobs (Same as dashboard) */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '30vh', background: 'var(--gradient-1)', filter: 'blur(100px)', opacity: 0.1, pointerEvents: 'none' }} />
      
      <div style={{ maxWidth: '400px', width: '100%', position: 'relative', zIndex: 10 }}>
        
        <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#A0AEC0', textDecoration: 'none', fontSize: '0.9rem', marginBottom: '1.5rem', width: 'fit-content' }}>
          <ArrowLeft size={16} /> Back to Login
        </Link>

        <GlassCard style={{ padding: '2.5rem', textAlign: 'center' }}>
          {!emailSent ? (
            <>
              <div style={{ width: '64px', height: '64px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Lock size={32} color="var(--gradient-1)" />
              </div>

              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Forgot Password?</h2>
              <p style={{ color: '#A0AEC0', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.5 }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {error && (
                  <div style={{ padding: '0.8rem', background: 'rgba(252,129,129,0.1)', border: '1px solid rgba(252,129,129,0.2)', color: '#FC8181', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'left' }}>
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

                <Button type="submit" disabled={isLoading} style={{ width: '100%', padding: '0.875rem', fontWeight: 600 }}>
                  {isLoading ? 'Sending Link...' : 'Send Reset Link'}
                </Button>
              </form>
            </>
          ) : (
            <div style={{ animation: 'fadeIn 0.5s' }}>
              <div style={{ width: '64px', height: '64px', background: 'rgba(72, 187, 120, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <CheckCircle size={32} color="#48BB78" />
              </div>

              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Check your email</h2>
              <p style={{ color: '#A0AEC0', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.5 }}>
                We've sent a password reset link to <strong>{email}</strong>
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Button 
                  onClick={() => window.open('https://mail.google.com', '_blank')}
                  style={{ width: '100%', padding: '0.875rem', fontWeight: 600, background: '#48BB78', border: 'none' }}
                >
                  Open Gmail
                </Button>
                <Link to="/login" style={{ display: 'block', color: 'var(--gradient-1)', textDecoration: 'none', fontWeight: 600 }}>
                  Back to Login
                </Link>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default ForgotPassword;
