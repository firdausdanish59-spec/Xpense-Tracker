import { getErrorMessage } from '../utils/errorHandler';
import { useState, useEffect } from 'react';
import { User, Palette, Database, Trash2, Shield, Download } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { PageHeader } from '../components/PageHeader';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useData } from '../context/DataContext';
import { updateUserProfile } from '../services/userService';
import { Toast } from '../components/Toast';
import { SkeletonLoader } from '../components/SkeletonLoader';

export const Settings = () => {
  const { userProfile, refreshProfile, loading } = useData();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [localName, setLocalName] = useState('');
  const [localIncome, setLocalIncome] = useState('');
  const [localCurrency, setLocalCurrency] = useState('₹');
  const [localUpi, setLocalUpi] = useState('');
  const [localPhone, setLocalPhone] = useState('');
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    if (userProfile) {
      setLocalName(userProfile.name || '');
      setLocalIncome(userProfile.monthlyIncome || '');
      setLocalCurrency(userProfile.currency || '₹');
      setLocalUpi(userProfile.upiId || '');
      setLocalPhone(userProfile.phone || '');
      setTheme(userProfile.theme || 'dark');
      document.documentElement.setAttribute('data-theme', userProfile.theme || 'dark');
    }
  }, [userProfile]);

  const handleSaveProfile = async () => { 
    setIsLoading(true);
    setSuccess('');
    setError('');
    try {
      await updateUserProfile({
        name: localName,
        monthlyIncome: Number(localIncome),
        currency: localCurrency,
        upiId: localUpi,
        phone: localPhone,
        theme: theme
      });
      await refreshProfile();
      setSuccess('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemeChange = async (newTheme) => { 
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    try {
      await updateUserProfile({
        ...userProfile,
        theme: newTheme
      });
      await refreshProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = () => {
    const data = {
      transactions: JSON.parse(localStorage.getItem('expanse-transactions-storage')),
      budgets: JSON.parse(localStorage.getItem('expanse-budget-storage')),
      goals: JSON.parse(localStorage.getItem('expanse-goals-storage')),
      subscriptions: JSON.parse(localStorage.getItem('expanse-subscriptions-storage')),
      groups: JSON.parse(localStorage.getItem('expanse-groups-storage')),
      settings: JSON.parse(localStorage.getItem('expanse-settings-storage'))
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'xpense-backup.json'; a.click();
  };

  const clearAllData = () => {
    if(window.confirm('Are you absolutely sure? This will delete all your data and reload the app!')) {
      localStorage.clear(); window.location.reload();
    }
  };

  if (loading) return <SkeletonLoader />;

  return (
    <div style={{ paddingBottom: '5rem', maxWidth: '800px' }}>
      <Toast message={success} type="success" onClose={() => setSuccess('')} />
      <Toast message={error} type="error" onClose={() => setError('')} />
      <PageHeader title="Settings" subtitle="Personalize your expense tracking experience" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Profile */}
        <GlassCard>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', fontSize: '1.05rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--gradient-1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={16} color="white" /></div>
            Profile Settings
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <Input label="Display Name" value={localName} onChange={e => setLocalName(e.target.value)} />
            <Input label="Monthly Income (₹)" type="number" value={localIncome} onChange={e => setLocalIncome(e.target.value)} style={{ fontFamily: 'var(--font-mono)' }} />
            <Input label="UPI ID" value={localUpi} onChange={e => setLocalUpi(e.target.value)} placeholder="name@upi" />
            <Input label="Phone Number" value={localPhone} onChange={e => setLocalPhone(e.target.value)} placeholder="e.g. 9876543210" />
          </div>
          <div style={{ width: '50%', marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Currency Symbol</label>
            <select className="input-base" value={localCurrency} onChange={e => setLocalCurrency(e.target.value)} style={{ width: '100%' }}>
              <option value="₹">INR (₹)</option><option value="$">USD ($)</option><option value="€">EUR (€)</option><option value="£">GBP (£)</option>
            </select>
          </div>
          <Button disabled={isLoading} onClick={handleSaveProfile}>
            {isLoading ? 'Saving...' : 'Save Profile'}
          </Button>
        </GlassCard>

        {/* Appearance */}
        <GlassCard>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', fontSize: '1.05rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--gradient-6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Palette size={16} color="white" /></div>
            Appearance
          </h3>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div onClick={() => handleThemeChange('dark')}
              style={{ flex: 1, padding: '1.25rem', borderRadius: 'var(--radius-card)', border: theme === 'dark' ? '2px solid #667EEA' : '1px solid var(--border-color)',
                background: '#0A0A0F', color: 'white', cursor: 'pointer', textAlign: 'center', fontWeight: 600,
                boxShadow: theme === 'dark' ? '0 0 20px rgba(102,126,234,0.2)' : 'none', transition: 'all 0.2s' }}>
              Dark Mode
            </div>
            <div onClick={() => handleThemeChange('light')}
              style={{ flex: 1, padding: '1.25rem', borderRadius: 'var(--radius-card)', border: theme === 'light' ? '2px solid #667EEA' : '1px solid var(--border-color)',
                background: '#F8FAFC', color: '#0F172A', cursor: 'pointer', textAlign: 'center', fontWeight: 600, transition: 'all 0.2s' }}>
              Light Mode
            </div>
          </div>
        </GlassCard>

        {/* Data & Privacy */}
        <GlassCard>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', fontSize: '1.05rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--gradient-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Database size={16} color="white" /></div>
            Data & Privacy
          </h3>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button variant="secondary" onClick={handleExport} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderRadius: 'var(--radius-btn)' }}>
              <Download size={16} /> Export Data
            </Button>
            <Button gradient="var(--gradient-2)" onClick={clearAllData} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderRadius: 'var(--radius-btn)' }}>
              <Trash2 size={16} /> Clear All Data
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default Settings;
