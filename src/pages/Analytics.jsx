import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Area, AreaChart } from 'recharts';
import { Leaf, Users, FastForward } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { PageHeader } from '../components/PageHeader';
import { useData } from '../context/DataContext';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { format, subDays } from 'date-fns';

const GRADIENTS = ['#667EEA', '#43E97B', '#F5576C', '#FA709A', '#4FACFE', '#A18CD1', '#FEE140', '#38F9D7'];

export const Analytics = () => {
  const { transactions, loading } = useData();
  const [timeRange, setTimeRange] = useState('Month');
  const [simulatorValue, setSimulatorValue] = useState(10);

  const { lineData, barData, pieData, totalExpense } = useMemo(() => {
    let days = 30;
    if (timeRange === 'Week') days = 7;
    if (timeRange === 'Year') days = 365;
    let totalExp = 0;
    const catMap = {};
    const lineMap = {};
    transactions.forEach(t => {
      const d = new Date(t.date);
      const diff = (new Date() - d) / (1000 * 60 * 60 * 24);
      if (diff <= days) {
        if (t.type === 'expense') { totalExp += t.amount; catMap[t.category] = (catMap[t.category] || 0) + t.amount; }
        const dateStr = format(d, timeRange === 'Year' ? 'MMM yyyy' : 'MMM dd');
        if (!lineMap[dateStr]) lineMap[dateStr] = { name: dateStr, income: 0, expense: 0 };
        lineMap[dateStr][t.type] += t.amount;
      }
    });
    const lData = Object.values(lineMap).reverse();
    const bData = Object.keys(catMap).map(k => ({ name: k.split(' ')[0], amount: catMap[k], full: k })).sort((a,b) => b.amount - a.amount).slice(0, 5);
    const pData = Object.keys(catMap).map((k, i) => ({ name: k.split(' ')[0], value: catMap[k], color: GRADIENTS[i % GRADIENTS.length] })).sort((a,b) => b.value - a.value);
    return { lineData: lData, barData: bData, pieData: pData, totalExpense: totalExp };
  }, [transactions, timeRange]);

  const heatmapCells = useMemo(() => {
    const cells = [];
    for(let i=29; i>=0; i--) {
      const d = subDays(new Date(), i);
      const totalDayExp = transactions.reduce((sum, t) => {
        if(t.type === 'expense' && format(new Date(t.date), 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd')) return sum + t.amount;
        return sum;
      }, 0);
      let opacity = 0.05;
      if (totalDayExp > 0) opacity = 0.3;
      if (totalDayExp > 500) opacity = 0.6;
      if (totalDayExp > 2000) opacity = 1;
      cells.push({ date: d, opacity });
    }
    return cells;
  }, [transactions]);

  const foodTotal = pieData.find(p => p.name === 'Food')?.value || 0;
  const monthlySavings = (foodTotal * (simulatorValue / 100));
  const yearlyProjection = monthlySavings * 12;
  const fiveYearProjection = yearlyProjection * 5 * 1.03;
  const tenYearProjection = yearlyProjection * 10 * 1.05;

  const TIME_PILLS = ['Week', 'Month', 'Year'];

  if (loading) return <SkeletonLoader />;

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <PageHeader title="Analytics" subtitle="Understand your money with deep insights" />

      {/* Time Selector */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.03)', padding: '0.25rem', borderRadius: 'var(--radius-pill)', width: 'fit-content' }}>
        {TIME_PILLS.map(tr => (
          <button key={tr} onClick={() => setTimeRange(tr)}
            style={{ background: timeRange === tr ? 'var(--gradient-1)' : 'transparent', backgroundImage: timeRange === tr ? 'var(--gradient-1)' : 'none',
              border: 'none', color: 'white', padding: '0.5rem 1.5rem', borderRadius: 'var(--radius-pill)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', transition: 'all 0.2s' }}>
            1 {tr.charAt(0)}
          </button>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <GlassCard style={{ height: '350px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.05rem' }}>Income vs Expenses</h3>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lineData}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#43E97B" stopOpacity={0.3}/><stop offset="100%" stopColor="#43E97B" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FC8181" stopOpacity={0.3}/><stop offset="100%" stopColor="#FC8181" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₹${v/1000}k`} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', fontFamily: 'var(--font-mono)' }} />
                <Area type="monotone" dataKey="income" stroke="#43E97B" strokeWidth={2} fill="url(#incomeGrad)" dot={false} />
                <Area type="monotone" dataKey="expense" stroke="#FC8181" strokeWidth={2} fill="url(#expenseGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard style={{ height: '350px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.05rem' }}>Top Categories</h3>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', fontFamily: 'var(--font-mono)' }} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={20}>
                  {barData.map((_, i) => <Cell key={i} fill={GRADIENTS[i % GRADIENTS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Spending Distribution */}
        <GlassCard style={{ height: '350px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.05rem' }}>Spending Distribution</h3>
          <div style={{ flex: 1, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', fontFamily: 'var(--font-mono)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <span style={{ fontSize: '1.1rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>₹{totalExpense.toLocaleString()}</span>
            </div>
          </div>
        </GlassCard>

        {/* Future Self Simulator */}
        <GlassCard glow="rgba(102, 126, 234, 0.15)">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1.05rem' }}>
            <FastForward size={20} color="#667EEA" /> Future Self Simulator
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            See the long-term impact of cutting down specific expenses.
          </p>
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
              <span>Reduce Food Spending by:</span>
              <strong style={{ fontFamily: 'var(--font-mono)', color: '#667EEA' }}>{simulatorValue}%</strong>
            </label>
            <input type="range" min="0" max="50" value={simulatorValue} onChange={e => setSimulatorValue(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#667EEA' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            {[{ label: '1 Year', val: yearlyProjection }, { label: '5 Years', val: fiveYearProjection }, { label: '10 Years', val: tenYearProjection }].map(m => (
              <div key={m.label} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-btn)', textAlign: 'center' }}>
                <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{m.label}</p>
                <p style={{ fontSize: '1.1rem', fontFamily: 'var(--font-mono)', fontWeight: 700, margin: 0, color: 'var(--color-income)' }}>+₹{m.val.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Heatmap */}
      <GlassCard>
        <h3 style={{ marginBottom: '0.75rem', fontSize: '1.05rem' }}>Spending Heatmap</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>Last 30 days of expense intensity.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {heatmapCells.map((cell, i) => (
            <div key={i} title={`${format(cell.date, 'MMM dd')}`}
              style={{ width: '20px', height: '20px', borderRadius: '4px', background: '#667EEA', opacity: cell.opacity, transition: 'opacity 0.2s', cursor: 'pointer' }} />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>Less</span>
          {[0.05, 0.3, 0.6, 1].map((o, i) => <div key={i} style={{ width: '12px', height: '12px', background: '#667EEA', opacity: o, borderRadius: '3px' }}/>)}
          <span>More</span>
        </div>
      </GlassCard>
    </div>
  );
};

export default Analytics;
