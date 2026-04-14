import { getErrorMessage } from '../utils/errorHandler';
import { useState, useMemo } from 'react';
import { Plus, Check, Search, Receipt, ArrowRight, Trash2, Edit2, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from './GlassCard';
import { Button } from './Button';
import { Input } from './Input';
import { Modal } from './Modal';
import { useData } from '../context/DataContext';
import { 
  addFriend, 
  deleteFriend,
  addOuting, 
  deleteOuting, 
  addQuickBillSettlement, 
  deleteQuickBillSettlement 
} from '../services/quickBillService';
import { SkeletonLoader } from './SkeletonLoader';
import { Toast } from './Toast';
import { format, isThisMonth } from 'date-fns';
import { formatWhatsAppReminder, formatGroupSummary, formatMonthlyReport, formatSettlementConfirmation, openWhatsApp } from '../utils/whatsapp';

export const QuickBillTab = () => {
  const { friends, outings, settlements, refreshQuickBill, loading: dataLoading, dataError } = useData();

  const [activeModal, setActiveModal] = useState(null); // 'outing' | 'friend' | 'settle'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFriend, setSelectedFriend] = useState(null);
  
  // Log Outing state
  const [newOuting, setNewOuting] = useState({
    name: '', date: new Date().toISOString().split('T')[0], note: '', paidBy: 'me', splitType: 'equal', participants: [{ id: 'me', name: 'Me (You)', share: 0 }]
  });
  const [newFriendName, setNewFriendName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [settleAmount, setSettleAmount] = useState('');

  // WhatsApp Preview state
  const [previewMessage, setPreviewMessage] = useState(null);
  const [previewPhone, setPreviewPhone] = useState('');

  const [copyFeedback, setCopyFeedback] = useState(false);

  // -------------------------------------------------------------
  // Derived state & Math Calculations
  // -------------------------------------------------------------
  const filteredOutings = useMemo(() => {
    if(!searchQuery) return outings;
    const lower = searchQuery.toLowerCase();
    return outings.filter(o => 
      o.name.toLowerCase().includes(lower) || 
      o.participants.some(p => p.name.toLowerCase().includes(lower))
    );
  }, [outings, searchQuery]);

  const balances = useMemo(() => {
    const bal = {}; // { friendId: netAmount } (positive = they owe me, negative = I owe them)
    outings.forEach(outing => {
      if (outing.paidBy === 'me') {
        outing.participants.forEach(p => {
          if (p.id !== 'me') {
            bal[p.id] = (bal[p.id] || 0) + Number(p.share);
          }
        });
      } else {
        const myShare = outing.participants.find(x => x.id === 'me')?.share || 0;
        if (myShare > 0) {
          bal[outing.paidBy] = (bal[outing.paidBy] || 0) - Number(myShare);
        }
      }
    });

    settlements.forEach(s => {
      if (s.direction === 'they_paid_me') bal[s.friendId] = (bal[s.friendId] || 0) - s.amount;
      else bal[s.friendId] = (bal[s.friendId] || 0) + s.amount;
    });

    return bal;
  }, [outings, settlements]);

  const monthlyTotals = useMemo(() => {
    const totalPaid = outings.filter(o => isThisMonth(new Date(o.date)) && o.paidBy === 'me').reduce((a,c) => a + Number(c.totalAmount), 0);
    const totalOwedToMe = Object.values(balances).filter(v => v > 0).reduce((a,c) => a + c, 0);
    return { paid: totalPaid, owed: totalOwedToMe };
  }, [outings, balances]);

  // -------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------
  const handleAddFriendAction = async (e) => {
    e.preventDefault();
    if(newFriendName) {
      setIsLoading(true);
      setError('');
      try {
        await addFriend({ name: newFriendName.trim() });
        await refreshQuickBill();
        setNewFriendName('');
        setActiveModal(null);
      } catch (err) {
        console.error(err);
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteFriendAction = async (id) => {
    
    setIsLoading(true);
    setError('');
    try {
      await deleteFriend(id);
      await refreshQuickBill();
      setActiveModal(null);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleParticipant = (friend) => {
    setNewOuting(prev => {
      const exists = prev.participants.some(p => p.id === friend.id);
      let newParts;
      if(exists) newParts = prev.participants.filter(p => p.id !== friend.id);
      else newParts = [...prev.participants, { id: friend.id, name: friend.name, share: 0 }];
      
      return { ...prev, participants: calculateShares(prev.totalAmount || 0, prev.splitType, newParts) };
    });
  };

  const calculateShares = (total, type, parts) => {
    if(type === 'equal') {
      const share = Number((total / (parts.length || 1)).toFixed(2));
      return parts.map(p => ({ ...p, share }));
    }
    return parts;
  };

  const handleSaveOuting = async (e) => {
    e.preventDefault();
    const finalTotal = newOuting.participants.reduce((acc, p) => acc + Number(p.share), 0);
    if(newOuting.splitType === 'custom' && Math.abs(finalTotal - newOuting.totalAmount) > 0.1) {
      alert("Custom splits must equal the total amount.");
      return;
    }
    
    setIsLoading(true);
    setError('');
    try {
      await addOuting({
        name: newOuting.name || 'Quick Bill',
        date: newOuting.date,
        note: newOuting.note,
        paidBy: newOuting.paidBy,
        totalAmount: newOuting.totalAmount,
        splitType: newOuting.splitType,
        participants: newOuting.participants
      });
      await refreshQuickBill();
      setActiveModal(null);
      setNewOuting({ name: '', date: new Date().toISOString().split('T')[0], note: '', paidBy: 'me', splitType: 'equal', participants: [{ id: 'me', name: 'Me (You)', share: 0 }] });
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOutingAction = async (id) => {
    
    setIsLoading(true);
    setError('');
    try {
      await deleteOuting(id);
      await refreshQuickBill();
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTotalChange = (val) => {
    const amt = Number(val);
    setNewOuting(prev => ({
      ...prev,
      totalAmount: amt,
      participants: calculateShares(amt, prev.splitType, prev.participants)
    }));
  };

  const handleSplitTypeChange = (type) => {
    setNewOuting(prev => ({
      ...prev,
      splitType: type,
      participants: calculateShares(prev.totalAmount || 0, type, prev.participants)
    }));
  };

  const openSettleModal = (friend) => {
    setSelectedFriend(friend);
    setSettleAmount(balances[friend.id] > 0 ? balances[friend.id] : Math.abs(balances[friend.id] || 0));
    setActiveModal('settle');
  };

  const handleConfirmSettlement = async (e) => {
    e.preventDefault();
    const amt = Number(settleAmount);
    if(amt > 0 && selectedFriend) {
      setIsLoading(true);
      setError('');
      try {
        await addQuickBillSettlement({
          friendId: selectedFriend.id,
          amount: amt,
          direction: balances[selectedFriend.id] > 0 ? 'they_paid_me' : 'i_paid_them'
        });
        await refreshQuickBill();
        const remaining = Math.abs((balances[selectedFriend.id] || 0)) - amt;
        const confirmMsg = formatSettlementConfirmation(selectedFriend.name, amt, remaining);
        setActiveModal(null);
        setTimeout(() => { setPreviewMessage(confirmMsg); setPreviewPhone(''); }, 300);
      } catch (err) {
        console.error(err);
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleUndoSettlementAction = async (id) => {
    
    setIsLoading(true);
    setError('');
    try {
      await deleteQuickBillSettlement(id);
      await refreshQuickBill();
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenReminderPreview = (friend) => {
    const friendOutings = outings.filter(o => o.paidBy === 'me' && o.participants.some(p => p.id === friend.id));
    const msg = formatWhatsAppReminder(friend, balances[friend.id], friendOutings);
    setPreviewMessage(msg);
  };

  const prefillLastOuting = () => {
    if(outings.length === 0) return;
    const last = outings[0];
    setNewOuting({
      name: last.name,
      date: new Date().toISOString().split('T')[0],
      note: '',
      paidBy: last.paidBy,
      totalAmount: '',
      splitType: last.splitType,
      participants: last.participants.map(p => ({ ...p, share: 0 }))
    });
    setActiveModal('outing');
  };

  // -------------------------------------------------------------
  // Renderers
  // -------------------------------------------------------------
  if (dataLoading) return <SkeletonLoader />;

  if (dataError === 'INDEX_REQUIRED') return null; // Handled by parent GroupSplit

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.3s' }}>
      <Toast message={error} type="error" onClose={() => setError('')} />
      
      {/* Monthly Summary */}
      {(monthlyTotals.paid > 0 || monthlyTotals.owed > 0) && (
        <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>This month you paid</p>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-mono)' }}>₹{monthlyTotals.paid.toLocaleString()}</h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>People owe you</p>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-mono)', color: 'var(--color-income)' }}>₹{monthlyTotals.owed.toLocaleString()}</h3>
            </div>
          </div>
          <Button onClick={() => setPreviewMessage(formatMonthlyReport(outings.filter(o => isThisMonth(new Date(o.date))), balances, monthlyTotals, friends))} 
            style={{ padding: '0.6rem', fontSize: '0.85rem', background: 'linear-gradient(135deg, #25D366, #128C7E)', border: 'none', display: 'flex', justifyContent: 'center', gap: '0.5rem', borderRadius: 'var(--radius-btn)' }}>
            <MessageCircle size={14} /> Share Report
          </Button>
        </GlassCard>
      )}

      {/* Section 1 - Friend List */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <button onClick={() => setActiveModal('add_friend')} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}><Plus size={24} /></div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Add Friend</span>
        </button>
        {friends.map(f => (
          <button key={f.id} onClick={() => { setSelectedFriend(f); setActiveModal('friend_detail'); }} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.2rem', fontWeight: 700, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
              {f.name.substring(0, 2).toUpperCase()}
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{f.name}</span>
          </button>
        ))}
      </div>

      {/* Section 2 - Main CTA */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <Button onClick={() => setActiveModal('outing')} className="btn-shimmer" style={{ flex: 1, padding: '1.2rem', fontSize: '1.1rem', borderRadius: 'var(--radius-card)' }}>
          + Log an Outing
        </Button>
        {outings.length >= 3 && (
          <Button variant="secondary" onClick={prefillLastOuting} style={{ padding: '0 1.2rem', borderRadius: 'var(--radius-card)' }}>
            <span style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column' }}>Use Last<strong style={{ fontSize: '1rem' }}>Template</strong></span>
          </Button>
        )}
      </div>

      {/* Section 4 - Running Balance Summary */}
      {friends.some(f => outings.some(o => o.participants.some(p => p.id === f.id))) && (
        <GlassCard>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>Outstanding Balances</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {friends.map(f => {
              const bal = balances[f.id] || 0;
              const hasInteracted = outings.some(o => o.participants.some(p => p.id === f.id));
              if (!hasInteracted) return null;
              
              const isSettled = Math.abs(bal) < 0.01;
              const isOwedToMe = bal > 0;
              
              return (
                <div key={f.id} onClick={() => { setSelectedFriend(f); setActiveModal('friend_detail'); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-btn)', cursor: 'pointer', transition: 'background 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.7rem', fontWeight: 700 }}>
                      {f.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem' }}>{f.name}</span>
                      {isSettled ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-income)', fontWeight: 600 }}>Settled up! 🎉</span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: isOwedToMe ? 'var(--color-income)' : 'var(--color-expense)' }}>
                          {isOwedToMe ? 'owes you' : 'you owe'} <strong style={{ fontFamily: 'var(--font-mono)' }}>₹{Math.abs(bal).toFixed(0)}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                  {!isSettled ? (
                    <Button onClick={(e) => { e.stopPropagation(); openSettleModal(f); }} variant="secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', borderRadius: 'var(--radius-pill)' }}>Mark Settled</Button>
                  ) : (
                    <div style={{ color: 'var(--text-muted)' }}><ArrowRight size={16} /></div>
                  )}
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* Section 3 - Recent Outings */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>Recent Outings</h3>
          {outings.length > 0 && (
            <div style={{ position: 'relative' }}>
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '0.4rem 0.4rem 0.4rem 2rem', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.8rem', width: '120px' }} />
            </div>
          )}
        </div>
        
        {filteredOutings.length === 0 ? (
          <GlassCard style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <Receipt size={48} color="var(--text-muted)" style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-muted)' }}>No outings logged yet.</p>
          </GlassCard>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredOutings.map(o => (
              <GlassCard key={o.id} style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{o.name}</h4>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Paid by <strong style={{ color: 'var(--text-primary)' }}>{o.paidBy === 'me' ? 'Vicky (Me)' : friends.find(f => f.id === o.paidBy)?.name}</strong> • {format(new Date(o.date), 'MMM dd')}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>₹{Number(o.totalAmount).toLocaleString()}</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => setPreviewMessage(formatGroupSummary(o, friends))} style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', border: 'none', color: 'white', cursor: 'pointer', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MessageCircle size={10}/> Share</button>
                      <button type="button" disabled={isLoading} onClick={() => handleDeleteOutingAction(o.id)} style={{ background: 'rgba(252,129,129,0.15)', border: '1px solid rgba(252,129,129,0.3)', color: 'var(--color-expense)', cursor: 'pointer', padding: '0.3rem 0.5rem', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', gap: '0.25rem' }}><Trash2 size={12} style={{ pointerEvents: 'none' }}/></button>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--radius-btn)' }}>
                  {o.participants.map(p => (
                    <span key={p.id} style={{ fontSize: '0.8rem', color: p.share > 0 ? 'var(--text-primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {p.id === 'me' ? 'Me' : friends.find(f => f.id === p.id)?.name || p.name} <span style={{ fontFamily: 'var(--font-mono)' }}>₹{p.share.toFixed(0)}</span>
                    </span>
                  ))}
                  {o.note && <div style={{ width: '100%', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{o.note}"</div>}
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* ------------------- MODALS ------------------- */}

      {/* Add Friend Modal */}
      <Modal isOpen={activeModal === 'add_friend'} onClose={() => setActiveModal(null)} title="Add Friend">
        <form onSubmit={handleAddFriendAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input label="Friend Name" required value={newFriendName} onChange={e => setNewFriendName(e.target.value)} placeholder="e.g. Rahul" />
          <Button type="submit" disabled={isLoading} className="modal-save-btn">
            {isLoading ? 'Saving...' : 'Save Friend'}
          </Button>
        </form>
      </Modal>

      {/* Log Outing Modal */}
      <Modal isOpen={activeModal === 'outing'} onClose={() => setActiveModal(null)} title="Log an Outing">
        <form onSubmit={handleSaveOuting} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Input label="Outing Name" required value={newOuting.name} onChange={e => setNewOuting({...newOuting, name: e.target.value})} placeholder="e.g. Monday Biryani" />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input label="Date" type="date" required value={newOuting.date} onChange={e => setNewOuting({...newOuting, date: e.target.value})} />
            <Input label="Total Bill (₹)" type="number" required value={newOuting.totalAmount || ''} onChange={e => handleTotalChange(e.target.value)} style={{ fontFamily: 'var(--font-mono)' }} placeholder="0" />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Who Came?</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button type="button" style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-pill)', border: '2px solid var(--gradient-1)', background: 'rgba(102,126,234,0.1)', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Check size={14} color="var(--gradient-1)" /> Me (You)
              </button>
              {friends.map(f => {
                const isSelected = newOuting.participants.some(p => p.id === f.id);
                return (
                  <button key={f.id} type="button" onClick={() => handleToggleParticipant(f)}
                    style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-pill)', transition: 'all 0.2s', border: isSelected ? '2px solid var(--color-income)' : '1px solid var(--border-color)', background: isSelected ? 'rgba(67,233,123,0.1)' : 'var(--bg-secondary)', color: isSelected ? 'white' : 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {isSelected && <Check size={14} color="var(--color-income)" />} {f.name}
                  </button>
                );
              })}
              <button type="button" onClick={() => setActiveModal('add_friend')} style={{ padding: '0.5rem', borderRadius: '50%', border: '1px dashed var(--text-muted)', background: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}><Plus size={16} /></button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Who Paid?</label>
            <select className="input-base" value={newOuting.paidBy} onChange={e => setNewOuting({...newOuting, paidBy: e.target.value})}>
              <option value="me">Me (You)</option>
              {friends.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: 'var(--radius-pill)' }}>
              <button type="button" onClick={() => handleSplitTypeChange('equal')} style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-pill)', border: 'none', fontWeight: 600, background: newOuting.splitType === 'equal' ? 'var(--bg-card)' : 'transparent', color: newOuting.splitType === 'equal' ? 'var(--text-primary)' : 'var(--text-muted)', boxShadow: newOuting.splitType === 'equal' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>Equal Split</button>
              <button type="button" onClick={() => handleSplitTypeChange('custom')} style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-pill)', border: 'none', fontWeight: 600, background: newOuting.splitType === 'custom' ? 'var(--bg-card)' : 'transparent', color: newOuting.splitType === 'custom' ? 'var(--text-primary)' : 'var(--text-muted)', boxShadow: newOuting.splitType === 'custom' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>Custom Split</button>
            </div>
            
            {newOuting.splitType === 'equal' ? (
              <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-card)', border: '1px dashed var(--border-color)' }}>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Each person pays</p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '1.5rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-income)' }}>₹{((newOuting.totalAmount || 0) / newOuting.participants.length).toFixed(2)}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {newOuting.participants.map((p, i) => (
                  <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 100px', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</span>
                    <Input type="number" placeholder="0" value={p.share} onChange={e => {
                      const newParts = [...newOuting.participants];
                      newParts[i].share = Number(e.target.value);
                      setNewOuting({...newOuting, participants: newParts});
                    }} style={{ fontFamily: 'var(--font-mono)', padding: '0.5rem' }} />
                  </div>
                ))}
                <div style={{ textAlign: 'right', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Remaining: </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: (newOuting.totalAmount - newOuting.participants.reduce((a,c)=>a+c.share,0)) === 0 ? 'var(--color-income)' : 'var(--color-expense)' }}>
                    ₹{(newOuting.totalAmount - newOuting.participants.reduce((a,c)=>a+c.share,0)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <Input label="Note (optional)" value={newOuting.note} onChange={e => setNewOuting({...newOuting, note: e.target.value})} placeholder="e.g. Shared Uber back" />
          <Button type="submit" disabled={isLoading} className="modal-save-btn">
            {isLoading ? 'Saving...' : 'Save Outing'}
          </Button>
        </form>
      </Modal>

      {/* Settle Up Modal */}
      <Modal isOpen={activeModal === 'settle'} onClose={() => setActiveModal(null)} title={`Settle with ${selectedFriend?.name}`}>
        <form onSubmit={handleConfirmSettlement} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>They owe you (or you owe them)</p>
            <h2 style={{ margin: '0.5rem 0 0', fontFamily: 'var(--font-mono)' }}>₹{Math.abs(balances[selectedFriend?.id] || 0).toFixed(0)}</h2>
          </div>
          <Input label="Amount Settled (₹)" type="number" required value={settleAmount} onChange={e => setSettleAmount(e.target.value)} style={{ fontFamily: 'var(--font-mono)' }} />
          <Button type="submit" disabled={isLoading} className="modal-save-btn">
            {isLoading ? 'Processing...' : 'Confirm Settlement'}
          </Button>
        </form>
      </Modal>

      {/* Per-Friend Detail Modal */}
      <Modal isOpen={activeModal === 'friend_detail'} onClose={() => setActiveModal(null)} title={`${selectedFriend?.name}'s Balance`}>
        {selectedFriend && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-card)' }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>Net Balance</p>
              <h2 style={{ margin: '0.5rem 0', fontFamily: 'var(--font-mono)', fontSize: '2rem', color: balances[selectedFriend.id] > 0 ? 'var(--color-income)' : balances[selectedFriend.id] < 0 ? 'var(--color-expense)' : 'white' }}>
                ₹{Math.abs(balances[selectedFriend.id] || 0).toFixed(0)}
              </h2>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>{balances[selectedFriend.id] > 0 ? 'they owe you' : balances[selectedFriend.id] < 0 ? 'you owe them' : 'all settled up!'}</p>
            </div>

            <div>
              <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Outing History</h4>
              <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {outings.filter(o => o.participants.some(p => p.id === selectedFriend.id)).map(o => {
                  const theirShare = o.participants.find(p => p.id === selectedFriend.id)?.share || 0;
                  return (
                    <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                      <span>{o.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({format(new Date(o.date), 'MMM dd')})</span></span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>₹{theirShare}</span>
                    </div>
                  );
                })}
              </div>

              <h4 style={{ margin: '1rem 0 0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Settlements</h4>
              <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {settlements.filter(s => s.friendId === selectedFriend.id).length === 0 ? (
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>No settlements yet.</p>
                ) : (
                  settlements.filter(s => s.friendId === selectedFriend.id).map(s => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                      <span>Settlement <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({format(new Date(s.date), 'MMM dd')})</span></span>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-income)' }}>₹{s.amount.toFixed(0)}</span>
                        <button disabled={isLoading} onClick={() => handleUndoSettlementAction(s.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button onClick={() => openSettleModal(selectedFriend)} style={{ flex: 1, borderRadius: 'var(--radius-pill)' }}>Settle Up</Button>
              <Button variant="secondary" onClick={() => handleOpenReminderPreview(selectedFriend)} style={{ flex: 1, borderRadius: 'var(--radius-pill)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #25D366, #128C7E)', color: 'white', border: 'none' }}>
                <MessageCircle size={16} /> Send Reminder
              </Button>
              <Button variant="secondary" onClick={() => handleDeleteFriendAction(selectedFriend.id)} style={{ flex: 'none', width: '48px', borderRadius: 'var(--radius-pill)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(252,129,129,0.3)', color: 'var(--color-expense)', background: 'rgba(252,129,129,0.1)' }}>
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Message Preview Modal */}
      <AnimatePresence>
        {previewMessage && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreviewMessage(null)} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(2px)' }} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ position: 'relative', width: '100%', maxWidth: '400px', background: 'var(--bg-card)', borderRadius: 'var(--radius-card)', padding: '1.5rem', zIndex: 10001, border: '1px solid var(--border-color)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Message Preview</h3>
                <button onClick={() => setPreviewMessage(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', overflowY: 'auto', maxHeight: '40vh', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {previewMessage}
                </pre>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button variant="secondary" onClick={() => { navigator.clipboard.writeText(previewMessage); setCopyFeedback(true); setTimeout(() => setCopyFeedback(false), 2000); }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  {copyFeedback ? '✅ Copied!' : '📋 Copy'}
                </Button>
                <Button onClick={() => openWhatsApp(previewPhone, previewMessage)} style={{ flex: 1, background: 'linear-gradient(135deg, #25D366, #128C7E)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <MessageCircle size={16} /> WhatsApp
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
