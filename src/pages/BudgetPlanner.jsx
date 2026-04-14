import { getErrorMessage } from '../utils/errorHandler';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Sparkles, Calendar as CalendarIcon, PartyPopper } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { useData } from '../context/DataContext';
import { updateBudgetLimit, toggleFestivalMode as toggleFestivalService } from '../services/budgetService';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { Toast } from '../components/Toast';
import { isAfter, startOfMonth } from 'date-fns';

const BUDGET_GRADIENTS = ['var(--gradient-5)', 'var(--gradient-3)', 'var(--gradient-2)', 'var(--gradient-1)', 'var(--gradient-4)', 'var(--gradient-5)', 'var(--gradient-6)', 'var(--gradient-1)'];
const BUDGET_COLORS = ['#FA709A', '#4FACFE', '#F5576C', '#667EEA', '#43E97B', '#FEE140', '#A18CD1', '#764BA2'];

export const BudgetPlanner = () => {
  const { budget, transactions, userProfile, refreshBudget, refreshProfile, loading } = useData();
  const budgets = budget?.categories || [];
  const festivalMode = userProfile?.festivalMode || false;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const currentMonthStart = startOfMonth(new Date());

  const [selectedBudget, setSelectedBudget] = useState(null);
  const [editAmount, setEditAmount] = useState('');

  const budgetData = useMemo(() => {
    let totalAlloc = 0, totalSpent = 0;
    const cats = budgets.map((b, i) => {
      const catName = b.category || b.name;
      const spent = transactions
        .filter(t => t.type === 'expense' && (t.category === catName || t.category === b.name) && isAfter(new Date(t.date), currentMonthStart))
        .reduce((sum, t) => sum + t.amount, 0);
      totalAlloc += b.allocated;
      totalSpent += spent;
      const percent = b.allocated > 0 ? (spent / b.allocated) * 100 : 0;
      let status = 'On Track', statusColor = 'var(--color-income)';
      if(percent >= 75 && percent < 100) { status = 'Warning'; statusColor = 'var(--color-warning)'; }
      if(percent >= 100) { status = 'Over Budget'; statusColor = 'var(--color-expense)'; }
      return { ...b, index: i, category: catName, spent, percent: Math.min(percent, 100), actualPercent: percent, status, statusColor, gradient: BUDGET_GRADIENTS[i % BUDGET_GRADIENTS.length], color: BUDGET_COLORS[i % BUDGET_COLORS.length] };
    });
    return { categories: cats, totalAlloc, totalSpent };
  }, [budgets, transactions, currentMonthStart]);

  const overallPercent = budgetData.totalAlloc > 0 ? (budgetData.totalSpent / budgetData.totalAlloc) * 100 : 0;
  let barGradient = 'var(--gradient-4)';
  if(overallPercent > 60) barGradient = 'var(--gradient-5)';
  if(overallPercent > 85) barGradient = 'var(--gradient-2)';

  const handleUpdate = async (e) => {
    e.preventDefault();
    if(selectedBudget && editAmount !== '') {
      setIsLoading(true);
      setError('');
      try {
        await updateBudgetLimit(selectedBudget.index, Number(editAmount));
        await refreshBudget();
        setSelectedBudget(null);
      } catch (err) {
        console.error(err);
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleToggleFestival = async () => {
    setIsLoading(true);
    setError('');
    try {
      await toggleFestivalService(festivalMode);
      await refreshProfile();
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) return <SkeletonLoader />;

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <Toast message={error} type="error" onClose={() => setError('')} />
      <PageHeader 
        title="Budget Planner" 
        subtitle="Control your limits and avoid overspending"
        actions={
          <Button disabled={isLoading} onClick={handleToggleFestival} gradient={festivalMode ? 'var(--gradient-5)' : undefined} 
            variant={festivalMode ? 'primary' : 'secondary'}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: 'var(--radius-pill)' }}>
            <PartyPopper size={18} />
            {festivalMode ? 'Festival Mode Active' : 'Festival Mode'}
          </Button>
        }
      />

      {/* Overall Budget Bar */}
      <GlassCard style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Budget vs Spent</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            <span style={{ color: 'var(--text-primary)' }}>₹{budgetData.totalSpent.toLocaleString()}</span>
            <span style={{ color: 'var(--text-muted)' }}> / ₹{budgetData.totalAlloc.toLocaleString()}</span>
          </span>
        </div>
        <div style={{ height: '12px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', overflow: 'hidden' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(overallPercent, 100)}%` }} transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ height: '100%', background: barGradient, borderRadius: '6px' }} />
        </div>
      </GlassCard>

      {/* Smart Suggestion */}
      <GlassCard style={{ borderLeft: '3px solid #667EEA', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.06 }}>
          <Sparkles size={80} />
        </div>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.5rem 0', background: 'var(--gradient-1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          <Sparkles size={18} color="#667EEA" /> Smart Suggestion
        </h4>
        <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
          Based on your last 3 months, you tend to overspend on <strong style={{ color: 'var(--text-primary)' }}>Food 🍔</strong> by ~₹2,500. Consider raising your food budget or bringing lunch to work twice a week!
        </p>
      </GlassCard>

      {/* Category Cards Grid */}
      <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Category Budgets</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        {budgetData.categories.map((cat, i) => (
          <motion.div key={cat.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard hover>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>{cat.category}</h3>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-badge)', color: cat.statusColor, background: `${cat.color}15` }}>
                  {cat.status === 'Over Budget' ? 'Oops! You went over 🚨' : cat.status}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Spent: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>₹{cat.spent.toLocaleString()}</span></span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>₹{cat.allocated.toLocaleString()}</span>
              </div>
              
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${cat.percent}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                  style={{ height: '100%', background: cat.gradient, borderRadius: '4px' }} />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: cat.statusColor, fontFamily: 'var(--font-mono)' }}>
                  {cat.actualPercent >= 100 ? `Over by ₹${(cat.spent - cat.allocated).toLocaleString()}` : `₹${(cat.allocated - cat.spent).toLocaleString()} left`}
                </span>
                <button onClick={() => { setSelectedBudget(cat); setEditAmount(cat.allocated); }} 
                  style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                  Edit
                </button>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <Modal isOpen={!!selectedBudget} onClose={() => setSelectedBudget(null)} title="Edit Budget Limit">
        {selectedBudget && (
          <form onSubmit={handleUpdate}>
            <h3 style={{ marginBottom: '1rem' }}>{selectedBudget.category}</h3>
            <Input label="Monthly Allocation Amount (₹)" type="number" required value={editAmount} onChange={e => setEditAmount(e.target.value)} style={{ fontFamily: 'var(--font-mono)' }} />
            <Button type="submit" disabled={isLoading} style={{ width: '100%', marginTop: '1rem' }}>
              {isLoading ? 'Saving...' : 'Save Limit'}
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default BudgetPlanner;
