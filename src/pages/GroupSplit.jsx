import { getErrorMessage } from '../utils/errorHandler';
import { useState, useMemo, useEffect } from 'react';
import { Plus, Users, ArrowRight, Share2, Receipt, Trash2, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../components/GlassCard';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { useData } from '../context/DataContext';
import { 
  addGroup, 
  deleteGroup, 
  addGroupExpense, 
  deleteGroupExpense, 
  addSettlement, 
  deleteSettlement 
} from '../services/groupService';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { Toast } from '../components/Toast';
import { format } from 'date-fns';
import { QuickBillTab } from '../components/QuickBillTab';

const MEMBER_COLORS = ['#667EEA', '#F5576C', '#43E97B', '#FA709A', '#4FACFE', '#A18CD1'];

export const GroupSplit = () => {
  const { groups, refreshGroups, loading, dataError } = useData();
  const [activeTab, setActiveTab] = useState('quick'); // 'quick' | 'group'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  
  // Update selectedGroupId when groups load or change
  useEffect(() => {
    if (!selectedGroupId && groups.length > 0) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  const selectedGroup = groups.find(g => g.id === selectedGroupId) || null;
  const [isGroupModalOpen, setGroupModalOpen] = useState(false);
  const [isExpenseModalOpen, setExpenseModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState('Me, ');
  const [newExp, setNewExp] = useState({ description: '', amount: '', paidBy: 'Me', includedMembers: [], date: new Date().toISOString().split('T')[0] });

  const { balances, simplifiedDebts } = useMemo(() => {
    if (!selectedGroup) return { balances: {}, simplifiedDebts: [] };
    const bal = {};
    selectedGroup.members.forEach(m => bal[m.trim()] = 0);
    selectedGroup.expenses.forEach(ex => {
      const payer = ex.paidBy.trim();
      const amount = Number(ex.amount);
      const included = ex.includedMembers && ex.includedMembers.length > 0 ? ex.includedMembers : selectedGroup.members.map(m => m.trim());
      const splitAmount = amount / included.length;
      if(bal[payer] !== undefined) bal[payer] += amount;
      included.forEach(m => { const mem = m.trim(); if(bal[mem] !== undefined) bal[mem] -= splitAmount; });
    });
    
    // Process settlements
    (selectedGroup.settlements || []).forEach(s => {
      if(bal[s.from] !== undefined) bal[s.from] += s.amount;
      if(bal[s.to] !== undefined) bal[s.to] -= s.amount;
    });

    const debtors = [], creditors = [];
    Object.keys(bal).forEach(m => { if(bal[m] < -0.01) debtors.push({ name: m, amount: -bal[m] }); else if(bal[m] > 0.01) creditors.push({ name: m, amount: bal[m] }); });
    debtors.sort((a,b) => b.amount - a.amount);
    creditors.sort((a,b) => b.amount - a.amount);
    const simplified = [];
    let i = 0, j = 0;
    while(i < debtors.length && j < creditors.length) {
      const d = debtors[i], c = creditors[j];
      const amount = Math.min(d.amount, c.amount);
      simplified.push({ from: d.name, to: c.name, amount });
      d.amount -= amount; c.amount -= amount;
      if(d.amount < 0.01) i++; if(c.amount < 0.01) j++;
    }
    return { balances: bal, simplifiedDebts: simplified };
  }, [selectedGroup]);

  const handleAddGroup = async (e) => { 
    e.preventDefault(); 
    if(groupName && members) { 
      setIsLoading(true);
      setError('');
      try {
        const id = await addGroup({ name: groupName, members: members.split(',').map(m => m.trim()).filter(m => m) }); 
        await refreshGroups();
        setSelectedGroupId(id);
        setGroupModalOpen(false); 
        setGroupName(''); 
        setMembers('Me, '); 
      } catch (err) {
        console.error(err);
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    } 
  };

  const handleAddExpense = async (e) => { 
    e.preventDefault(); 
    if(newExp.description && newExp.amount && selectedGroup) { 
      setIsLoading(true);
      setError('');
      try {
        const included = newExp.includedMembers && newExp.includedMembers.length > 0 
          ? newExp.includedMembers 
          : selectedGroup.members.map(m => m.trim()); 
          
        await addGroupExpense(selectedGroup.id, { 
          description: newExp.description, 
          amount: Number(newExp.amount), 
          paidBy: newExp.paidBy, 
          split: 'Equal', 
          includedMembers: included, 
          date: new Date(newExp.date).toISOString() 
        }); 
        await refreshGroups();
        setExpenseModalOpen(false); 
        setNewExp({ description: '', amount: '', paidBy: 'Me', includedMembers: [], date: new Date().toISOString().split('T')[0] }); 
      } catch (err) {
        console.error(err);
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    } 
  };

  const handleDeleteGroup = async (gId) => {
    if(true) {
      setIsLoading(true);
      setError('');
      try {
        await deleteGroup(gId);
        await refreshGroups();
        if(selectedGroupId === gId) {
          const remaining = groups.filter(g => g.id !== gId);
          setSelectedGroupId(remaining[0]?.id || null);
        }
      } catch (err) {
        console.error(err);
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteExpense = async (gId, exId) => {
    if(true) {
      setIsLoading(true);
      setError('');
      try {
        await deleteGroupExpense(gId, exId, selectedGroup.expenses);
        await refreshGroups();
      } catch (err) {
        console.error(err);
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleMarkSettled = async (debt) => {
    setIsLoading(true);
    setError('');
    try {
      await addSettlement(selectedGroupId, {
        from: debt.from,
        to: debt.to,
        amount: debt.amount,
        date: new Date().toISOString()
      });
      await refreshGroups();
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUndoSettlement = async (settlementId) => {
    if(true) {
      setIsLoading(true);
      setError('');
      try {
        await deleteSettlement(selectedGroupId, settlementId, selectedGroup.settlements);
        await refreshGroups();
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
      <PageHeader title="Split Costs" subtitle="Manage shared expenses without the math headache" />
      
      {/* 🚀 Top Level Feature Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: 'var(--radius-pill)', width: 'fit-content' }}>
        <button onClick={() => setActiveTab('quick')} style={{ padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-pill)', border: 'none', fontWeight: 600, background: activeTab === 'quick' ? 'var(--bg-card)' : 'transparent', color: activeTab === 'quick' ? 'var(--text-primary)' : 'var(--text-muted)', boxShadow: activeTab === 'quick' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s', cursor: 'pointer' }}>
          Quick Bill
        </button>
        <button onClick={() => setActiveTab('group')} style={{ padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-pill)', border: 'none', fontWeight: 600, background: activeTab === 'group' ? 'var(--bg-card)' : 'transparent', color: activeTab === 'group' ? 'var(--text-primary)' : 'var(--text-muted)', boxShadow: activeTab === 'group' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s', cursor: 'pointer' }}>
          Group Split
        </button>
      </div>

      {activeTab === 'quick' && <QuickBillTab />}

      {activeTab === 'group' && (
        <div style={{ animation: 'fadeIn 0.3s' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <Button onClick={() => setGroupModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: 'var(--radius-btn)' }}>
              <Plus size={18} /> New Group
            </Button>
          </div>

          {/* Group selector pills */}
      <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        {groups.map(g => {
          const isActive = selectedGroupId === g.id;
          return (
            <button key={g.id} onClick={() => setSelectedGroupId(g.id)}
              style={{
                padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-pill)', border: isActive ? 'none' : '1px solid var(--border-color)', cursor: 'pointer', whiteSpace: 'nowrap',
                background: isActive ? 'var(--gradient-1)' : 'var(--bg-secondary)',
                color: isActive ? 'white' : 'var(--text-secondary)',
                fontWeight: 600, transition: 'all 0.2s', fontSize: '0.85rem',
                boxShadow: isActive ? '0 4px 15px rgba(102,126,234,0.3)' : 'none'
              }}>
              {g.name}
            </button>
          );
        })}
      </div>

      {selectedGroup ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Group Info */}
          <GlassCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>{selectedGroup.name}</h2>
                {/* Avatar cluster */}
                <div style={{ display: 'flex', gap: '-0.5rem' }}>
                  {selectedGroup.members.map((m, i) => (
                    <div key={i} style={{ width: '32px', height: '32px', borderRadius: '50%', background: `linear-gradient(135deg, ${MEMBER_COLORS[i % MEMBER_COLORS.length]}, ${MEMBER_COLORS[(i+1) % MEMBER_COLORS.length]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.7rem', fontWeight: 700, marginLeft: i > 0 ? '-8px' : 0, border: '2px solid var(--bg-card)' }}>
                      {m.trim().charAt(0)}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button variant="secondary" style={{ borderRadius: 'var(--radius-btn)', padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                  <Share2 size={14} style={{ marginRight: '0.25rem' }} /> Share
                </Button>
                <button 
                  disabled={isLoading}
                  onClick={() => handleDeleteGroup(selectedGroup.id)}
                  style={{ background: 'rgba(252,129,129,0.1)', border: 'none', color: 'var(--color-expense)', borderRadius: 'var(--radius-btn)', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <h3 style={{ margin: '1.5rem 0 1rem', fontSize: '1rem', background: 'var(--gradient-1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Who owes who?</h3>
            {simplifiedDebts.length === 0 ? (
              <p style={{ color: 'var(--color-income)', fontWeight: 600 }}>All settled up! 🎉</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {simplifiedDebts.map((debt, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: 'var(--radius-btn)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600, background: 'var(--gradient-2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{debt.from}</span>
                      <ArrowRight size={16} color="var(--text-muted)" />
                      <span style={{ fontWeight: 600, background: 'var(--gradient-4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{debt.to}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-expense)' }}>₹{debt.amount.toFixed(0)}</span>
                      <Button onClick={() => handleMarkSettled(debt)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', borderRadius: 'var(--radius-badge)' }}>
                        Mark Paid ✓
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Settlements History */}
            {selectedGroup?.settlements && selectedGroup.settlements.length > 0 && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Settlements</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[...(selectedGroup.settlements || [])].sort((a,b) => new Date(b.date) - new Date(a.date)).map(s => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-btn)' }}>
                      <span><strong style={{ color: 'var(--text-primary)' }}>{s.from}</strong> paid <strong style={{ color: 'var(--text-primary)' }}>{s.to}</strong></span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span>₹{s.amount.toLocaleString()} • {format(new Date(s.date), 'MMM dd')}</span>
                        <button disabled={isLoading} onClick={() => handleUndoSettlement(s.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </GlassCard>

          {/* Group Expenses */}
          <GlassCard style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Group Expenses</h3>
              <Button onClick={() => { setNewExp({...newExp, includedMembers: selectedGroup.members.map(m => m.trim())}); setExpenseModalOpen(true); }} style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-btn)', fontSize: '0.8rem' }}><Plus size={14} style={{ marginRight: '0.25rem' }} /> Add</Button>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '500px' }}>
              {selectedGroup.expenses.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
                  <Receipt size={40} style={{ opacity: 0.15, marginBottom: '1rem' }} />
                  <p style={{ color: 'var(--text-muted)' }}>No expenses added yet.</p>
                </div>
              ) : (
                [...selectedGroup.expenses].reverse().map(ex => (
                  <div key={ex.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem' }}>{ex.description}</h4>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Paid by <strong style={{ color: 'var(--text-primary)' }}>{ex.paidBy}</strong> • {format(new Date(ex.date), 'MMM dd')}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem' }}>₹{ex.amount.toLocaleString()}</span>
                      <button disabled={isLoading} onClick={() => handleDeleteExpense(selectedGroup.id, ex.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>
      ) : (
        <GlassCard><p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Please select or create a group.</p></GlassCard>
      )}

      <Modal isOpen={isGroupModalOpen} onClose={() => setGroupModalOpen(false)} title="Create New Group">
        <form onSubmit={handleAddGroup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input label="Group Name" required value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="e.g. Goa Trip" />
          <Input label="Members (comma separated)" required value={members} onChange={e => setMembers(e.target.value)} />
          <Button type="submit" disabled={isLoading} className="modal-save-btn">
            {isLoading ? 'Creating...' : 'Create Group'}
          </Button>
        </form>
      </Modal>

      <Modal isOpen={isExpenseModalOpen} onClose={() => setExpenseModalOpen(false)} title="Add Group Expense">
        {selectedGroup && (
          <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '1rem' }}>
            <Input label="Description" required value={newExp.description} onChange={e => setNewExp({...newExp, description: e.target.value})} />
            <Input label="Amount (₹)" type="number" required value={newExp.amount} onChange={e => setNewExp({...newExp, amount: e.target.value})} style={{ fontFamily: 'var(--font-mono)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Who paid?</label>
              <select className="input-base" value={newExp.paidBy} onChange={e => setNewExp({...newExp, paidBy: e.target.value})}>
                {selectedGroup.members.map(m => <option key={m} value={m.trim()}>{m.trim()}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Who was included?</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {selectedGroup.members.map(m => {
                  const mem = m.trim();
                  const isIncluded = newExp.includedMembers?.includes(mem);
                  return (
                    <button type="button" key={mem} onClick={() => {
                        const current = newExp.includedMembers || selectedGroup.members.map(x => x.trim());
                        let updated;
                        if (current.includes(mem)) {
                          updated = current.filter(x => x !== mem);
                          if (updated.length === 0) updated = [mem]; // Keep at least one
                        } else {
                          updated = [...current, mem];
                        }
                        setNewExp({...newExp, includedMembers: updated});
                      }} 
                      style={{ padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-pill)', border: isIncluded ? '2px solid var(--color-income)' : '1px solid var(--border-color)', background: isIncluded ? 'rgba(67,233,123,0.1)' : 'var(--bg-secondary)', color: isIncluded ? 'white' : 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', transition: 'all 0.2s' }}>
                      {isIncluded && <Check size={12} color="var(--color-income)" />} {mem}
                    </button>
                  );
                })}
              </div>
            </div>
            <Input label="Date" type="date" required value={newExp.date} onChange={e => setNewExp({...newExp, date: e.target.value})} />
            <Button type="submit" disabled={isLoading} className="modal-save-btn">
              {isLoading ? 'Splitting...' : 'Split Expense'}
            </Button>
          </form>
        )}
      </Modal>
        </div>
      )}
    </div>
  );
};

export default GroupSplit;
