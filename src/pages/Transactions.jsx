import { getErrorMessage } from '../utils/errorHandler';
import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { Search, Filter, Download, Mic, Trash2, Edit2, Plus, Calendar, Tag, ReceiptText } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { useData } from '../context/DataContext';
import { 
  addTransaction, 
  deleteTransaction, 
  updateTransaction, 
  deleteMultipleTransactions 
} from '../services/transactionService';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { Toast } from '../components/Toast';
import { format, isToday, isYesterday } from 'date-fns';

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
  'Interest 📈': { gradient: 'var(--gradient-4)', color: '#43E97B' },
};

export const Transactions = () => {
  const { transactions, refreshTransactions, loading } = useData();
  const { isMobile } = useBreakpoint();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);

  const [formData, setFormData] = useState({
    amount: '', type: 'expense', category: 'Food 🍔', merchant: '', date: new Date().toISOString().split('T')[0], note: ''
  });

  const [swipedId, setSwipedId] = useState(null);
  const touchStart = useRef(null);

  const handleTouchStart = (e) => {
    touchStart.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e, id) => {
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (diff > 60) setSwipedId(id);   // swipe left
    if (diff < -60) setSwipedId(null); // swipe right
  };

  const CATEGORIES = ['Food 🍔', 'Transport 🚗', 'Shopping 🛍️', 'Entertainment 🎬', 'Health ⚕️', 'Bills 🧾', 'Education 📚', 'Other 🧩', 'Salary 💰', 'Freelance 💻'];

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.merchant.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (t.note && t.note.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = filterType === 'all' || t.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [transactions, searchTerm, filterType]);

  // Group by date
  const groupedTransactions = useMemo(() => {
    const groups = {};
    const sorted = [...filteredTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    sorted.forEach(tx => {
      const d = new Date(tx.date);
      let label;
      if (isToday(d)) label = 'Today';
      else if (isYesterday(d)) label = 'Yesterday';
      else label = format(d, 'MMMM dd');
      if (!groups[label]) groups[label] = { transactions: [], total: 0 };
      groups[label].transactions.push(tx);
      if (tx.type === 'expense') groups[label].total += tx.amount;
    });
    return groups;
  }, [filteredTransactions]);

  const toggleSelection = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleDeleteSelected = async () => {
    if(true) {
      setIsLoading(true);
      setError('');
      try {
        await deleteMultipleTransactions(selectedIds);
        await refreshTransactions();
        setSelectedIds([]);
        setIsSelectionMode(false);
      } catch (err) {
        console.error(err);
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(true);
        setIsLoading(false);
      }
    }
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Merchant', 'Amount', 'Note'];
    const rows = filteredTransactions.map(t => 
      [format(new Date(t.date), 'yyyy-MM-dd'), t.type, t.category, t.merchant, t.amount, t.note || ''].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
  };

  const openAddModal = () => {
    setEditingTx(null);
    setFormData({ amount: '', type: 'expense', category: 'Food 🍔', merchant: '', date: new Date().toISOString().split('T')[0], note: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (tx) => {
    setEditingTx(tx);
    setFormData({ ...tx, date: new Date(tx.date).toISOString().split('T')[0] });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const data = { ...formData, amount: Number(formData.amount), date: new Date(formData.date).toISOString() };
      if(editingTx) {
        await updateTransaction(editingTx.id, data);
      } else {
        await addTransaction(data);
      }
      await refreshTransactions();
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOne = async (id) => {
    
    setIsLoading(true);
    setError('');
    try {
      await deleteTransaction(id);
      await refreshTransactions();
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const FILTER_PILLS = [
    { key: 'all', label: 'All', gradient: 'var(--gradient-1)' },
    { key: 'income', label: 'Income', gradient: 'var(--gradient-4)' },
    { key: 'expense', label: 'Expenses', gradient: 'var(--gradient-2)' },
  ];

  if (loading) return <SkeletonLoader />;

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <Toast message={error} type="error" onClose={() => setError('')} />
      <PageHeader 
        title="Transactions" 
        subtitle="Manage and track your income and expenses"
        actions={
          <>
             <Button variant="secondary" onClick={handleExportCSV} title="Export CSV" style={{ padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-btn)' }}>
              <Download size={18} />
             </Button>
             <Button onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: 'var(--radius-btn)' }}>
               <Plus size={18} /> Record Expense
             </Button>
          </>
        }
      />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Transactions</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage and track your income and expenses</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleExportCSV} className="btn-secondary" style={{ padding: '0.6rem' }}><Download size={18} /></button>
          <button onClick={openAddModal} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Plus size={18} /> {isMobile ? '' : 'Record'}</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem', marginBottom: '1.5rem', alignItems: isMobile ? 'stretch' : 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search merchants, notes..." 
            className="input-base" 
            style={{ paddingLeft: '3rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select 
            className="input-base" 
            style={{ width: isMobile ? '100%' : '150px' }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
          </select>
          <button className="btn-secondary" onClick={() => setIsSelectionMode(!isSelectionMode)} style={{ flex: isMobile ? 1 : 'none' }}>
            <Filter size={18} />
          </button>
        </div>
      </div>

      {isSelectionMode && selectedIds.length > 0 && (
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleDeleteSelected} className="btn-danger">Delete Selected ({selectedIds.length})</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {Object.entries(groupedTransactions).map(([dateLabel, group]) => (
          <div key={dateLabel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', padding: '0 0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>{dateLabel}</span>
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-expense)' }}>-₹{group.total.toLocaleString()}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <AnimatePresence>
                {group.transactions.map((tx, idx) => {
                  const catInfo = CATEGORY_GRADIENTS[tx.category] || { gradient: 'var(--gradient-1)', color: '#667EEA' };
                  return (
                    <div key={tx.id} style={{ position: 'relative', overflow: 'hidden', borderRadius: '12px' }}>
                      <motion.div 
                        onTouchStart={handleTouchStart}
                        onTouchEnd={(e) => handleTouchEnd(e, tx.id)}
                        style={{
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '1rem', 
                          padding: '1rem', 
                          background: selectedIds.includes(tx.id) ? 'rgba(102, 126, 234, 0.1)' : 'rgba(255,255,255,0.02)',
                          cursor: 'pointer',
                          transform: swipedId === tx.id ? 'translateX(-70px)' : 'translateX(0)',
                          transition: 'transform 0.2s ease',
                          zIndex: 2,
                          position: 'relative'
                        }}
                        onClick={() => isSelectionMode ? toggleSelection(tx.id) : handleEditTx(tx)}
                      >
                        {isSelectionMode && (
                          <div style={{ 
                            width: '20px', height: '20px', borderRadius: '6px', 
                            border: `2px solid ${selectedIds.includes(tx.id) ? 'var(--accent-primary)' : 'var(--text-muted)'}`,
                            background: selectedIds.includes(tx.id) ? 'var(--accent-primary)' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {selectedIds.includes(tx.id) && <Check size={14} color="white" />}
                          </div>
                        )}
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: catInfo.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
                          {tx.category.split(' ').pop()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{tx.merchant}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                            {!isMobile && tx.note && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>• {tx.note}</span>}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem', color: tx.type === 'income' ? 'var(--color-income)' : 'var(--color-expense)' }}>
                            {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()}
                          </p>
                          {!isMobile && <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>{format(new Date(tx.date), 'hh:mm a')}</p>}
                        </div>
                      </motion.div>
                      
                      {isMobile && swipedId === tx.id && (
                        <div 
                          style={{
                            position: 'absolute',
                            right: 0, top: 0, bottom: 0,
                            width: '70px',
                            background: '#FC8181',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '0 12px 12px 0',
                            cursor: 'pointer',
                            zIndex: 1
                          }}
                          onClick={() => {
                            handleDeleteTx(tx.id);
                            setSwipedId(null);
                          }}
                        >
                          <Trash2 size={24} color="white" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        ))}
        
        {filteredTransactions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            <ReceiptText size={48} style={{ opacity: 0.15, marginBottom: '1rem' }} />
            <h3 style={{ background: 'var(--gradient-1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' }}>Your wallet looks quiet 👀</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>No transactions found. Start recording your expenses!</p>
            <Button onClick={openAddModal}>Record Expense</Button>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTx ? "Edit Transaction" : "Record Expense"}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button type="button" variant={formData.type === 'expense' ? 'primary' : 'secondary'} onClick={() => setFormData({...formData, type: 'expense'})} gradient={formData.type === 'expense' ? 'var(--gradient-2)' : undefined} style={{ flex: 1, borderRadius: 'var(--radius-pill)' }}>Expense</Button>
            <Button type="button" variant={formData.type === 'income' ? 'primary' : 'secondary'} onClick={() => setFormData({...formData, type: 'income'})} gradient={formData.type === 'income' ? 'var(--gradient-4)' : undefined} style={{ flex: 1, borderRadius: 'var(--radius-pill)' }}>Income</Button>
          </div>
          <Input label="Amount (₹)" type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', textAlign: 'center' }} placeholder="0.00" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</label>
             <select className="input-base" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
               {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
          </div>
          <Input label="Merchant / Source Name" type="text" required value={formData.merchant} onChange={e => setFormData({...formData, merchant: e.target.value})} />
          <Input label="Date" type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          <Input label="Note (Optional)" type="text" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
          <Button type="submit" disabled={isLoading} className="btn-shimmer" style={{ marginTop: '0.5rem', width: '100%', padding: '1rem', fontSize: '0.95rem' }}>
            {isLoading ? 'Saving...' : (editingTx ? 'Save Changes' : 'Record Transaction')}
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default Transactions;
