import { getErrorMessage } from '../utils/errorHandler';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Wallet, TrendingUp, TrendingDown, PiggyBank, Flame, CalendarClock, Crown, ArrowUpRight } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { useData } from '../context/DataContext';
import { addTransaction } from '../services/transactionService';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { Toast } from '../components/Toast';
import { format, isAfter, subDays, startOfMonth, differenceInDays } from 'date-fns';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useBreakpoint } from '../hooks/useBreakpoint';

const CATEGORY_GRADIENTS = {
  'Food 🍔': { gradient: 'var(--gradient-5)', color: '#FA709A' },
  'Transport 🚗': { gradient: 'var(--gradient-3)', color: '#4FACFE' },
  'Shopping 🛍️': { gradient: 'var(--gradient-2)', color: '#F5576C' },
  'Entertainment 🎬': { gradient: 'var(--gradient-1)', color: '#667EEA' },
  'Health ⚕️': { gradient: 'var(--gradient-4)', color: '#43E97B' },
  'Bills 🧾': { gradient: 'var(--gradient-5)', color: '#FEE140' },
  'Education 📚': { gradient: 'var(--gradient-6)', color: '#A18CD1' },
  'Other 🧩': { gradient: 'var(--gradient-1)', color: '#764BA2' },
  'Salary 💰': { gradient: 'var(--gradient-4)', color: '#38F9D7' },
  'Freelance 💻': { gradient: 'var(--gradient-3)', color: '#00F2FE' },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export const Dashboard = () => {
  const { transactions, budget, userProfile, nextBill, loading, refreshTransactions } = useData();
  const { user } = useAuth();
  const { isMobile } = useBreakpoint();
  
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const currency = userProfile?.currency || '₹';
  const profileName = userProfile?.name || '';
  const budgets = budget?.categories || [];

  const currentMonthStart = startOfMonth(new Date());

  const { income, expense, balance, savingsRate } = useMemo(() => {
    let inc = 0, exp = 0;
    transactions.forEach(t => {
      if (isAfter(new Date(t.date), currentMonthStart)) {
        if (t.type === 'income') inc += t.amount;
        if (t.type === 'expense') exp += t.amount;
      }
    });
    const bal = inc - exp;
    const rate = inc > 0 ? ((inc - exp) / inc) * 100 : 0;
    return { income: inc, expense: exp, balance: bal, savingsRate: rate.toFixed(1) };
  }, [transactions, currentMonthStart]);

  const recentTransactions = [...transactions].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  const totalBudget = budgets.reduce((acc, b) => acc + (b.allocated || 0), 0);
  const budgetUsedPercent = totalBudget > 0 ? Math.min((expense / totalBudget) * 100, 100) : 0;

  const last7Days = useMemo(() => {
    const days = [];
    for(let i=6; i>=0; i--) {
      const d = subDays(new Date(), i);
      const dateStr = format(d, 'MMM dd');
      const dayTotal = transactions.filter(t => t.type === 'expense' && format(new Date(t.date), 'MMM dd') === dateStr).reduce((a,c) => a + c.amount, 0);
      days.push({ name: format(d, 'EEE'), amount: dayTotal });
    }
    return days;
  }, [transactions]);

  const noSpendStreak = useMemo(() => {
    let streak = 0;
    for(let i=0; i<30; i++) {
      const d = subDays(new Date(), i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const hasExpense = transactions.some(t => t.type === 'expense' && t.date.startsWith(dateStr));
      if (!hasExpense) streak++;
      else break;
    }
    return streak;
  }, [transactions]);

  const nextBillDays = nextBill ? Math.max(0, differenceInDays(new Date(nextBill.nextDue), new Date())) : 0;

  // Quick Add State
  const [newTx, setNewTx] = useState({ amount: '', type: 'expense', category: 'Food 🍔', merchant: '' });

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if(newTx.amount && newTx.merchant) {
      setIsLoading(true);
      setError('');
      try {
        await addTransaction({
          amount: Number(newTx.amount),
          type: newTx.type,
          category: newTx.category,
          merchant: newTx.merchant,
          date: new Date().toISOString(),
          note: 'Quick Add'
        });
        await refreshTransactions();
        setAddModalOpen(false);
        setNewTx({ amount: '', type: 'expense', category: 'Food 🍔', merchant: '' });
      } catch (err) {
        console.error(err);
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Top category
  const topCategory = useMemo(() => {
    const catMap = {};
    transactions.forEach(t => {
      if(t.type === 'expense' && isAfter(new Date(t.date), currentMonthStart)) {
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      }
    });
    const sorted = Object.entries(catMap).sort((a,b) => b[1] - a[1]);
    return sorted[0] || ['None', 0];
  }, [transactions, currentMonthStart]);

  const STAT_CARDS = [
    { label: 'Monthly Income', value: income, gradient: 'var(--gradient-4)', color: '#43E97B', icon: TrendingUp, change: '+12%' },
    { label: 'Monthly Expenses', value: expense, gradient: 'var(--gradient-2)', color: '#F5576C', icon: TrendingDown, change: '-5%' },
    { label: 'Savings', value: balance, gradient: 'var(--gradient-3)', color: '#4FACFE', icon: PiggyBank, change: '+8%' },
    { label: 'Budget Used', value: `${budgetUsedPercent.toFixed(0)}%`, gradient: 'var(--gradient-5)', color: '#FA709A', icon: Wallet, isMono: false, change: '-2%' },
  ];

  if (loading) return <SkeletonLoader />;

  return (
    <div style={{ position: 'relative', minHeight: '100%', paddingBottom: isMobile ? '7rem' : '5rem' }}>
      <Toast message={error} type="error" onClose={() => setError('')} />
      <PageHeader 
        title={`${isMobile ? 'Hey' : getGreeting()}, ${user?.displayName?.split(' ')[0] || profileName || 'there'} 👋`} 
        subtitle={isMobile ? "Your money status" : "Here's what's happening with your money today."}
      />

      {/* HERO BALANCE CARD */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div style={{
          background: 'var(--gradient-1)',
          borderRadius: 'var(--radius-card)',
          padding: isMobile ? '1.5rem' : '2rem 2.5rem',
          marginBottom: '2rem',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(102, 126, 234, 0.3)'
        }}>
          {/* Grid pattern overlay */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.5) 39px, rgba(255,255,255,0.5) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.5) 39px, rgba(255,255,255,0.5) 40px)', backgroundSize: '40px 40px' }} />
          
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>Total Balance</p>
              <h2 style={{ margin: '0 0 1rem', fontSize: isMobile ? '2rem' : '3rem', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '-0.02em' }}>
                {currency}{balance.toLocaleString()}
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ background: 'rgba(72, 187, 120, 0.25)', color: '#48BB78', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-pill)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  +{currency}{income.toLocaleString()}
                </span>
                <span style={{ background: 'rgba(252, 129, 129, 0.25)', color: '#FC8181', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-pill)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  -{currency}{expense.toLocaleString()}
                </span>
              </div>
            </div>
            
            {!isMobile && (
              <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="white" strokeWidth="3" 
                    strokeDasharray={`${savingsRate} ${100 - savingsRate}`} strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 1s ease' }} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <span style={{ fontSize: '1.1rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{savingsRate}%</span>
                  <span style={{ fontSize: '0.6rem', opacity: 0.7, textTransform: 'uppercase' }}>saved</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* 4 STAT CARDS */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '0.75rem', 
        marginBottom: '2rem' 
      }}>
        {STAT_CARDS.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <GlassCard hover style={{ position: 'relative', padding: isMobile ? '1rem' : '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{ width: isMobile ? '32px' : '40px', height: isMobile ? '32px' : '40px', borderRadius: '10px', background: card.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <card.icon size={isMobile ? 16 : 20} color="white" />
                </div>
                <span style={{ fontSize: isMobile ? '0.7rem' : '0.85rem', color: 'var(--text-secondary)' }}>{isMobile ? card.label.replace('Monthly ', '') : card.label}</span>
              </div>
              <p style={{ fontSize: isMobile ? '1.1rem' : '1.5rem', fontFamily: card.isMono === false ? 'var(--font-heading)' : 'var(--font-mono)', fontWeight: 700, margin: '0' }}>
                {typeof card.value === 'number' ? `${currency}${card.value.toLocaleString()}` : card.value}
              </p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* MIDDLE ROW */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', 
        gap: '1.5rem', 
        marginBottom: '1.5rem' 
      }}>
        
        {/* Spending Chart */}
        <GlassCard style={{ minHeight: '280px' }}>
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Spending Overview</h3>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7Days}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#667EEA" stopOpacity={0.4}/>
                    <stop offset="100%" stopColor="#764BA2" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', fontFamily: 'var(--font-mono)' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#667EEA" strokeWidth={3} fill="url(#spendGrad)" dot={{ r: 4, fill: '#667EEA', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#764BA2' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Quick Stats Panel */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: '1rem', overflowX: isMobile ? 'auto' : 'visible', paddingBottom: isMobile ? '0.5rem' : '0' }}>
          <GlassCard style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: isMobile ? '200px' : 'auto', flex: 1 }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--gradient-5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Flame size={20} color="white" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Streak</p>
              <p style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#FA709A' }}>{noSpendStreak} days</p>
            </div>
          </GlassCard>

          <GlassCard style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: isMobile ? '200px' : 'auto', flex: 1 }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--gradient-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CalendarClock size={20} color="white" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Next Bill</p>
              {nextBill ? (
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>{nextBill.name} <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-info)' }}>({nextBillDays}d)</span></p>
              ) : (
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-income)' }}>All clear ✓</p>
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* RECENT TRANSACTIONS */}
      <GlassCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Recent Activity</h3>
          <a href="/transactions" style={{ color: 'var(--accent-primary)', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }}>
            See all
          </a>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {recentTransactions.map((tx, i) => {
            const catInfo = CATEGORY_GRADIENTS[tx.category] || { gradient: 'var(--gradient-1)', color: '#667EEA' };
            return (
              <motion.div key={tx.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}
              >
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: catInfo.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                  {tx.category.split(' ').pop()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.merchant}</p>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>{format(new Date(tx.date), 'MMM dd')}</p>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: isMobile ? '0.9rem' : '1rem', color: tx.type === 'income' ? 'var(--color-income)' : 'var(--color-expense)' }}>
                  {tx.type === 'income' ? '+' : '-'}{currency}{tx.amount.toLocaleString()}
                </span>
              </motion.div>
            );
          })}
        </div>
      </GlassCard>

      {/* Quick Add Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title="Quick Record">
        <form onSubmit={handleQuickAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button type="button" variant={newTx.type === 'expense' ? 'primary' : 'secondary'} onClick={() => setNewTx({...newTx, type: 'expense'})} 
              gradient={newTx.type === 'expense' ? 'var(--gradient-2)' : undefined} style={{ flex: 1, borderRadius: 'var(--radius-pill)', fontSize: '0.8rem' }}>Expense</Button>
            <Button type="button" variant={newTx.type === 'income' ? 'primary' : 'secondary'} onClick={() => setNewTx({...newTx, type: 'income'})} 
              gradient={newTx.type === 'income' ? 'var(--gradient-4)' : undefined} style={{ flex: 1, borderRadius: 'var(--radius-pill)', fontSize: '0.8rem' }}>Income</Button>
          </div>
          <Input label="Amount" type="number" placeholder="0.00" value={newTx.amount} onChange={(e) => setNewTx({...newTx, amount: e.target.value})} required style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', textAlign: 'center' }} />
          <Input label="Where" type="text" placeholder={newTx.type === 'expense' ? "e.g. Starbucks" : "e.g. Salary"} value={newTx.merchant} onChange={(e) => setNewTx({...newTx, merchant: e.target.value})} required />
          <Button type="submit" disabled={isLoading} className="modal-save-btn btn-shimmer">
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </form>
      </Modal>

    </div>
  );
};

export default Dashboard;
