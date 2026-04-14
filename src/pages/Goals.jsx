import { getErrorMessage } from '../utils/errorHandler';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Coins, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { GlassCard } from '../components/GlassCard';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { useData } from '../context/DataContext';
import { addGoal, deleteGoal, contributeToGoal } from '../services/goalService';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { Toast } from '../components/Toast';
import { format, differenceInDays } from 'date-fns';

const GOAL_GRADIENTS = ['var(--gradient-1)', 'var(--gradient-2)', 'var(--gradient-3)', 'var(--gradient-4)', 'var(--gradient-5)', 'var(--gradient-6)'];
const GOAL_COLORS = [['#667EEA', '#764BA2'], ['#F093FB', '#F5576C'], ['#4FACFE', '#00F2FE'], ['#43E97B', '#38F9D7'], ['#FA709A', '#FEE140'], ['#A18CD1', '#FBC2EB']];

export const Goals = () => {
  const { goals, refreshGoals, loading } = useData();
  const { isMobile } = useBreakpoint();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fundingGoal, setFundingGoal] = useState(null);
  const [fundAmount, setFundAmount] = useState('');
  const [newGoal, setNewGoal] = useState({ name: '', emoji: '🎯', targetAmount: '', targetDate: new Date().toISOString().split('T')[0], dailySaving: 0 });

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if(newGoal.name && newGoal.targetAmount) {
      setIsLoading(true);
      setError('');
      try {
        await addGoal({ ...newGoal, targetAmount: Number(newGoal.targetAmount), dailySaving: Number(newGoal.dailySaving) });
        await refreshGoals();
        setIsModalOpen(false);
        setNewGoal({ name: '', emoji: '🎯', targetAmount: '', targetDate: new Date().toISOString().split('T')[0], dailySaving: 0 });
      } catch (err) {
        console.error(err);
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteGoal = async (gId) => {
    if (true) {
      setIsLoading(true);
      setError('');
      try {
        await deleteGoal(gId);
        await refreshGoals();
      } catch (err) {
        console.error(err);
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleFund = async (e) => {
    e.preventDefault();
    if(fundingGoal && fundAmount) {
      setIsLoading(true);
      setError('');
      try {
        const amount = Number(fundAmount);
        await contributeToGoal(fundingGoal.id, amount, fundingGoal.savedAmount, fundingGoal.targetAmount);
        await refreshGoals();
        
        const updatedTotal = fundingGoal.savedAmount + amount;
        if (updatedTotal >= fundingGoal.targetAmount && fundingGoal.savedAmount < fundingGoal.targetAmount) {
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#667EEA', '#764BA2', '#43E97B', '#F5576C'] });
        }
        setFundingGoal(null); 
        setFundAmount('');
      } catch (err) {
        console.error(err);
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (loading) return <SkeletonLoader />;

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <Toast message={error} type="error" onClose={() => setError('')} />
      <PageHeader title="Savings Goals" subtitle={isMobile ? "Track your big dreams" : "Turn your big dreams into actionable milestones"}
        actions={<Button onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: 'var(--radius-btn)', padding: isMobile ? '0.6rem' : '0.75rem 1.5rem' }}>
          <Plus size={18} /> {!isMobile && 'New Goal'}
        </Button>} />

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
        <AnimatePresence>
          {goals.map((g, idx) => {
            const percent = Math.min((g.savedAmount / g.targetAmount) * 100, 100);
            const isCompleted = percent >= 100;
            const daysLeft = Math.max(differenceInDays(new Date(g.targetDate), new Date()), 0);
            const colorPair = GOAL_COLORS[idx % GOAL_COLORS.length];
            const gradient = GOAL_GRADIENTS[idx % GOAL_GRADIENTS.length];

            return (
              <motion.div key={g.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                <GlassCard hover style={{ position: 'relative', overflow: 'hidden', background: isCompleted ? `linear-gradient(135deg, rgba(67,233,123,0.08), rgba(56,249,215,0.08))` : 'var(--bg-card)' }}>
                  {isCompleted && (
                    <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                      <Trophy size={24} color="#FEE140" />
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', boxShadow: `0 4px 15px ${colorPair[0]}33` }}>
                      {g.emoji}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 0.2rem', fontSize: '1.05rem' }}>{g.name}</h3>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Target: ₹{g.targetAmount.toLocaleString()}</p>
                    </div>
                    <button disabled={isLoading} onClick={() => handleDeleteGoal(g.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </div>

                  {/* Circular Progress Ring */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
                    <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
                      <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke={`url(#goalGrad${idx})`} strokeWidth="3"
                          strokeDasharray={`${percent} ${100 - percent}`} strokeLinecap="round"
                          style={{ transition: 'stroke-dasharray 1s ease' }} />
                        <defs>
                          <linearGradient id={`goalGrad${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={colorPair[0]} />
                            <stop offset="100%" stopColor={colorPair[1]} />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '0.9rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{percent.toFixed(0)}%</span>
                      </div>
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Saved</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>₹{g.savedAmount.toLocaleString()}</span>
                      </div>
                      {g.dailySaving > 0 && <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--color-income)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Coins size={12} /> Autosave: ₹{g.dailySaving}/day</p>}
                      {!isCompleted && <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>⏳ {daysLeft} days left</p>}
                      {isCompleted && <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--color-income)', fontWeight: 700 }}>Nailed it! 🎉</p>}
                    </div>
                  </div>

                  {!isCompleted && (
                    <Button disabled={isLoading} onClick={() => setFundingGoal(g)} gradient={gradient} style={{ width: '100%', borderRadius: 'var(--radius-btn)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <Plus size={16} /> Add Funds
                    </Button>
                  )}
                </GlassCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Goal">
        <form onSubmit={handleAddGoal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '1rem' }}>
            <Input label="Emoji" required value={newGoal.emoji} onChange={e => setNewGoal({...newGoal, emoji: e.target.value})} />
            <Input label="Goal Name" required value={newGoal.name} onChange={e => setNewGoal({...newGoal, name: e.target.value})} placeholder="e.g. Dream Car" />
          </div>
          <Input label="Target Amount (₹)" type="number" required value={newGoal.targetAmount} onChange={e => setNewGoal({...newGoal, targetAmount: e.target.value})} style={{ fontFamily: 'var(--font-mono)' }} />
          <Input label="Target Date" type="date" required value={newGoal.targetDate} onChange={e => setNewGoal({...newGoal, targetDate: e.target.value})} />
          <Input label="Daily Auto-Save (₹, optional)" type="number" value={newGoal.dailySaving} onChange={e => setNewGoal({...newGoal, dailySaving: e.target.value})} placeholder="0" style={{ fontFamily: 'var(--font-mono)' }} />
          <Button type="submit" disabled={isLoading} className="modal-save-btn">
            {isLoading ? 'Creating...' : 'Create Goal'}
          </Button>
        </form>
      </Modal>

      <Modal isOpen={!!fundingGoal} onClose={() => setFundingGoal(null)} title={`Fund: ${fundingGoal?.name}`}>
        <form onSubmit={handleFund} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '1rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Remaining amount needed</p>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-mono)' }}>₹{fundingGoal && (fundingGoal.targetAmount - fundingGoal.savedAmount).toLocaleString()}</h2>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
            {[500, 1000, 5000].map(amt => (
              <Button key={amt} type="button" variant="secondary" onClick={() => setFundAmount(amt)} style={{ flex: 1, fontFamily: 'var(--font-mono)', borderRadius: 'var(--radius-btn)' }}>+₹{amt}</Button>
            ))}
          </div>
          <Input label="Custom Amount (₹)" type="number" required value={fundAmount} onChange={e => setFundAmount(e.target.value)} style={{ fontFamily: 'var(--font-mono)' }} />
          <Button type="submit" disabled={isLoading} className="modal-save-btn">
            {isLoading ? 'Processing...' : 'Add Funds'}
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default Goals;
