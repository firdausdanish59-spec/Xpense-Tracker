import { getErrorMessage } from '../utils/errorHandler';
import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { Modal } from './Modal';
import { useData } from '../context/DataContext';
import { addTransaction as addTransactionService } from '../services/transactionService';
import { Toast } from './Toast';
import { Button } from './Button';
import { Input } from './Input';

const AppLayout = () => {
  const [isMobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  
  const { userProfile, isGlobalAddOpen, setGlobalAddOpen, refreshTransactions } = useData();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [newTx, setNewTx] = useState({ amount: '', type: 'expense', category: 'Food 🍔', merchant: '', note: '', date: new Date().toISOString().split('T')[0] });

  // Theme management
  useEffect(() => {
    if (userProfile?.theme) {
      document.documentElement.setAttribute('data-theme', userProfile.theme);
    }
  }, [userProfile?.theme]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') return;
      if (e.key && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setGlobalAddOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setGlobalAddOpen]);

  const handleGlobalAdd = async (e) => {
    e.preventDefault();
    if(newTx.amount && newTx.merchant) {
      setIsLoading(true);
      setError('');
      try {
        await addTransactionService({
          ...newTx,
          amount: Number(newTx.amount),
          date: new Date(newTx.date).toISOString()
        });
        await refreshTransactions();
        setGlobalAddOpen(false);
        setNewTx({ amount: '', type: 'expense', category: 'Food 🍔', merchant: '', note: '', date: new Date().toISOString().split('T')[0] });
      } catch (err) {
        console.error(err);
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const CATEGORIES = ['Food 🍔', 'Transport 🚗', 'Shopping 🛍️', 'Entertainment 🎬', 'Health ⚕️', 'Bills 🧾', 'Education 📚', 'Other 🧩', 'Salary 💰', 'Freelance 💻'];

  return (
    <div className="app-container" style={{ position: 'relative' }}>
      <Toast message={error} type="error" onClose={() => setError('')} />
      
      <div className="sidebar-wrapper">
        <Sidebar isMobileOpen={isMobileOpen} setMobileOpen={setMobileOpen} />
      </div>
      
      <main className="main-content">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          style={{ minHeight: '100%' }}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Bottom Navigation for Mobile */}
      <BottomNav onAddClick={() => setGlobalAddOpen(true)} />

      <Modal isOpen={isGlobalAddOpen} onClose={() => setGlobalAddOpen(false)} title="Record Expense">
        <form onSubmit={handleGlobalAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
           <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Button type="button" variant={newTx.type === 'expense' ? 'primary' : 'secondary'} onClick={() => setNewTx({...newTx, type: 'expense'})} 
                gradient={newTx.type === 'expense' ? 'var(--gradient-2)' : undefined}
                style={{ flex: 1, borderRadius: 'var(--radius-pill)' }}>Expense</Button>
              <Button type="button" variant={newTx.type === 'income' ? 'primary' : 'secondary'} onClick={() => setNewTx({...newTx, type: 'income'})} 
                gradient={newTx.type === 'income' ? 'var(--gradient-4)' : undefined}
                style={{ flex: 1, borderRadius: 'var(--radius-pill)' }}>Income</Button>
           </div>
           
           <Input label="Amount (₹)" type="number" required value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} 
             style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', textAlign: 'center' }} placeholder="0.00" />
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</label>
               <select className="input-base" value={newTx.category} onChange={e => setNewTx({...newTx, category: e.target.value})}>
                 {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
           </div>

           <Input label="Merchant / Source" type="text" required value={newTx.merchant} onChange={e => setNewTx({...newTx, merchant: e.target.value})} />
           <Input label="Note" type="text" value={newTx.note} onChange={e => setNewTx({...newTx, note: e.target.value})} />

           <Input label="Date" type="date" required value={newTx.date || ''} onChange={e => setNewTx({...newTx, date: e.target.value})} />

           <Button type="submit" disabled={isLoading} className="modal-save-btn btn-shimmer">
             {isLoading ? 'Saving...' : 'Save Transaction'}
           </Button>
        </form>
      </Modal>

    </div>
  );
};

export default AppLayout;
