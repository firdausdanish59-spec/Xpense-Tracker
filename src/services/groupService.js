import { db, auth } from '../config/firebase';
import {
  collection, addDoc, getDocs, doc,
  updateDoc, deleteDoc, query, where,
  arrayUnion
} from 'firebase/firestore';
import { cleanData } from '../utils/firestore';

const COL = 'groups';

const getUser = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return user;
};

export const getGroups = async () => {
  const user = getUser();
  const q = query(
    collection(db, COL),
    where('createdBy', '==', user.uid)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const addGroup = async (data) => {
  const user = getUser();
  const docRef = await addDoc(collection(db, COL), cleanData({
    createdBy:   user.uid,
    name:        data.name || '',
    members:     data.members || [],
    expenses:    [],
    settlements: [],
    createdAt:   new Date().toISOString()
  }));
  return docRef.id;
};

export const deleteGroup = async (id) => {
  getUser();
  await deleteDoc(doc(db, COL, id));
};

export const addGroupExpense = async (groupId, expense) => {
  getUser();
  const newExpense = cleanData({
    id:              `exp_${Date.now()}`,
    description:     expense.description || '',
    amount:          Number(expense.amount) || 0,
    paidBy:          expense.paidBy || '',
    date:            expense.date || new Date().toISOString(),
    split:           expense.split || 'Equal',
    includedMembers: expense.includedMembers || [],
    createdAt:       new Date().toISOString()
  });
  await updateDoc(doc(db, COL, groupId), {
    expenses: arrayUnion(newExpense)
  });
};

export const deleteGroupExpense = async (groupId, expenseId, currentExpenses) => {
  getUser();
  const updated = (currentExpenses || []).filter(e => e.id !== expenseId);
  await updateDoc(doc(db, COL, groupId), {
    expenses: updated
  });
};

export const addSettlement = async (groupId, settlement) => {
  getUser();
  const newSettlement = cleanData({
    id:        `settle_${Date.now()}`,
    from:      settlement.from || '',
    to:        settlement.to || '',
    amount:    Number(settlement.amount) || 0,
    date:      new Date().toISOString()
  });
  await updateDoc(doc(db, COL, groupId), {
    settlements: arrayUnion(newSettlement)
  });
};

export const deleteSettlement = async (groupId, settlementId, currentSettlements) => {
  getUser();
  const updated = (currentSettlements || []).filter(s => s.id !== settlementId);
  await updateDoc(doc(db, COL, groupId), {
    settlements: updated
  });
};
