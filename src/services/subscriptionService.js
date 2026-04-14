import { db, auth } from '../config/firebase';
import {
  collection, addDoc, getDocs, doc,
  updateDoc, deleteDoc, query, where
} from 'firebase/firestore';
import { cleanData } from '../utils/firestore';

const COL = 'subscriptions';

const getUser = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return user;
};

export const getSubscriptions = async () => {
  const user = getUser();
  const q = query(
    collection(db, COL),
    where('userId', '==', user.uid)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue));
};

export const getNextBill = async () => {
  const subs = await getSubscriptions();
  const active = subs.filter(s => s.isActive !== false);
  if (!active.length) return null;
  return active[0]; // Already sorted by nextDue ascending
};

export const addSubscription = async (data) => {
  const user = getUser();
  const docRef = await addDoc(collection(db, COL), cleanData({
    userId:      user.uid,
    name:        data.name || '',
    amount:      Number(data.amount) || 0,
    cycle:       data.cycle || 'monthly', 
    nextDue:     data.nextDue || '',
    category:    data.category || '',
    isActive:    true,
    lastUsed:    data.lastUsed || null,
    createdAt:   new Date().toISOString()
  }));
  return docRef.id;
};

export const updateSubscription = async (id, data) => {
  getUser();
  await updateDoc(doc(db, COL, id), cleanData({
    ...data,
    amount: data.amount !== undefined ? Number(data.amount) : undefined,
    updatedAt: new Date().toISOString()
  }));
};

export const deleteSubscription = async (id) => {
  getUser();
  await deleteDoc(doc(db, COL, id));
};
