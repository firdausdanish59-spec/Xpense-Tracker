import { db, auth } from '../config/firebase';
import { 
  collection, addDoc, getDocs, doc,
  updateDoc, deleteDoc, query, where
} from 'firebase/firestore';
import { cleanData } from '../utils/firestore';

const COL = 'transactions';

const getUser = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return user;
};

// GET ALL transactions for current user
export const getTransactions = async () => {
  const user = getUser();
  const q = query(
    collection(db, COL),
    where('userId', '==', user.uid)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
};

// GET transactions for current month only
export const getMonthlyTransactions = async (year, month) => {
  const user = getUser();
  const start = new Date(year, month, 1).toISOString();
  const end   = new Date(year, month + 1, 0).toISOString();
  
  const q = query(
    collection(db, COL),
    where('userId', '==', user.uid)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(t => t.date >= start && t.date <= end)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
};

// ADD new transaction
export const addTransaction = async (data) => {
  const user = getUser();
  const docRef = await addDoc(collection(db, COL), cleanData({
    userId:      user.uid,
    type:        data.type,       // 'income' or 'expense'
    amount:      Number(data.amount) || 0,
    category:    data.category || '',
    merchant:    data.merchant || '',
    date:        data.date || new Date().toISOString(),
    note:        data.note || '',
    isRecurring: data.isRecurring || false,
    createdAt:   new Date().toISOString()
  }));
  return docRef.id;
};

// UPDATE transaction
export const updateTransaction = async (id, data) => {
  getUser();
  await updateDoc(doc(db, COL, id), cleanData({
    ...data,
    amount: data.amount !== undefined ? Number(data.amount) : undefined,
    updatedAt: new Date().toISOString()
  }));
};

// DELETE transaction
export const deleteTransaction = async (id) => {
  getUser();
  await deleteDoc(doc(db, COL, id));
};

// DELETE multiple transactions
export const deleteMultipleTransactions = async (ids) => {
  getUser();
  for (const id of ids) {
    await deleteDoc(doc(db, COL, id));
  }
};

// GET summary (total income, total expense this month)
export const getMonthlySummary = async () => {
  const now   = new Date();
  const txns  = await getMonthlyTransactions(now.getFullYear(), now.getMonth());
  
  const income  = txns
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const expense = txns
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return { income, expense, net: income - expense };
};
