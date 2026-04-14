import { getErrorMessage } from '../utils/errorHandler';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, AlertTriangle, Trash2, Repeat } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { useData } from '../context/DataContext';
import { addSubscription, deleteSubscription } from '../services/subscriptionService';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { Toast } from '../components/Toast';
import { format } from 'date-fns';

export const Subscriptions = () => {
  const { subscriptions, refreshSubscriptions, loading } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [newSub, setNewSub] = useState({ name: '', amount: '', cycle: 'Monthly', nextDue: new Date().toISOString().split('T')[0], category: 'Entertainment 🎬', usage: 'High' });
  const CATEGORIES = ['Entertainment 🎬', 'Health ⚕️', 'Education 📚', 'Utilities ⚡', 'Software 💻'];

  const { totalMonthly, phantomSubs, phantomYearlyCost, activeCount } = useMemo(() => {
    let monthly = 0; const phantoms = []; let pYearly = 0; let active = 0;
    subscriptions.forEach(s => {
      if (s.cycle === 'Monthly') monthly += s.amount;
      if (s.cycle === 'Yearly') monthly += s.amount / 12;
      if (s.usage === 'Low') {
        phantoms.push(s);
        pYearly += s.cycle === 'Monthly' ? s.amount * 12 : s.amount;
      } else { active++; }
    });
    return { totalMonthly: monthly, phantomSubs: phantoms, phantomYearlyCost: pYearly, activeCount: active };
  }, [subscriptions]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if(newSub.name && newSub.amount) {
      setIsLoading(true);
      setError('');
      try {
        await addSubscription({ ...newSub, amount: Number(newSub.amount), nextDue: new Date(newSub.nextDue).toISOString() });
        await refreshSubscriptions();
        setIsModalOpen(false);
        setNewSub({ name: '', amount: '', cycle: 'Monthly', nextDue: new Date().toISOString().split('T')[0], category: 'Entertainment 🎬', usage: 'High' });
      } catch (err) {
        console.error(err);
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDelete = async (id) => {
    
    setIsLoading(true);
    setError('');
    try {
      await deleteSubscription(id);
      await refreshSubscriptions();
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const STAT_CARDS = [
    { label: 'Total Monthly', value: `₹${totalMonthly.toFixed(0)}`, gradient: 'var(--gradient-1)' },
    { label: 'Active', value: activeCount, gradient: 'var(--gradient-4)' },
    { label: 'Phantom', value: phantomSubs.length, gradient: 'var(--gradient-2)' },
    { label: 'Yearly Cost', value: `₹${(totalMonthly * 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, gradient: 'var(--gradient-3)' },
  ];

  if (loading) return <SkeletonLoader />;

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <Toast message={error} type="error" onClose={() => setError('')} />
      <PageHeader title="Subscriptions" subtitle="Manage recurring payments and cut the noise."
        actions={<Button onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: 'var(--radius-btn)' }}><Plus size={18} /> Add</Button>} />

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {STAT_CARDS.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <GlassCard>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.label}</p>
              <p style={{ margin: 0, fontSize: '1.5rem', fontFamily: 'var(--font-mono)', fontWeight: 700, background: c.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{c.value}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Phantom Detector */}
      {phantomSubs.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard glow="rgba(245, 87, 108, 0.15)" style={{ marginBottom: '2rem', borderLeft: '3px solid #F5576C' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ padding: '0.7rem', background: 'var(--gradient-2)', borderRadius: '12px', flexShrink: 0 }}>
                <AlertTriangle size={22} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>Phantom Subscription Detector</h3>
                <p style={{ margin: '0 0 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {phantomSubs.length} subscription(s) with low usage detected. Canceling could save you <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-income)' }}>₹{phantomYearlyCost.toLocaleString()}/year</strong>.
                </p>
                <Button gradient="var(--gradient-2)" style={{ borderRadius: 'var(--radius-pill)', fontSize: '0.85rem' }}>
                  Review & Save ₹{phantomYearlyCost.toLocaleString()}/year
                </Button>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Subscription Cards */}
      <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>All Subscriptions</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        <AnimatePresence>
          {subscriptions.map((s, i) => (
            <motion.div key={s.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: i * 0.04 }}>
              <GlassCard hover style={{ position: 'relative' }}>
                {s.usage === 'Low' && <div style={{ position: 'absolute', top: '1rem', right: '1rem', width: '8px', height: '8px', borderRadius: '50%', background: '#F5576C', boxShadow: '0 0 8px #F5576C', animation: 'pulse-glow 2s infinite' }} />}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--gradient-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>
                    {s.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>{s.name}</h3>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.category}</p>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem' }}>₹{s.amount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Next: <span style={{ color: '#4FACFE', fontFamily: 'var(--font-mono)' }}>{format(new Date(s.nextDue), 'MMM dd')}</span></span>
                  <span style={{ color: s.usage === 'Low' ? '#F5576C' : 'var(--color-income)', fontWeight: 600, fontSize: '0.7rem', background: s.usage === 'Low' ? 'rgba(245,87,108,0.12)' : 'rgba(72,187,120,0.12)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-badge)' }}>
                    {s.usage}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button disabled={isLoading} onClick={() => handleDelete(s.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Subscription">
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input label="Service Name" required value={newSub.name} onChange={e => setNewSub({...newSub, name: e.target.value})} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input label="Amount (₹)" type="number" required value={newSub.amount} onChange={e => setNewSub({...newSub, amount: e.target.value})} style={{ fontFamily: 'var(--font-mono)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Billing Cycle</label>
              <select className="input-base" value={newSub.cycle} onChange={e => setNewSub({...newSub, cycle: e.target.value})}><option value="Monthly">Monthly</option><option value="Yearly">Yearly</option></select>
            </div>
          </div>
          <Input label="Next Due Date" type="date" required value={newSub.nextDue} onChange={e => setNewSub({...newSub, nextDue: e.target.value})} />
          <Button type="submit" disabled={isLoading} style={{ marginTop: '0.5rem' }}>
            {isLoading ? 'Saving...' : 'Save Subscription'}
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default Subscriptions;
