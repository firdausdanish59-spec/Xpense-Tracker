import { db, auth } from '../config/firebase';
import {
  collection, addDoc, getDocs, doc,
  deleteDoc, query, where
} from 'firebase/firestore';
import { cleanData } from '../utils/firestore';

const getUser = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return user;
};

// FRIENDS
export const getFriends = async () => {
  const user = getUser();
  const q = query(
    collection(db, 'quickbill_friends'),
    where('userId', '==', user.uid)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
};

export const addFriend = async (data) => {
  const user = getUser();
  const colors = ['#8B5CF6','#06B6D4','#F5576C','#43E97B','#F6AD55','#A18CD1'];
  const docRef = await addDoc(collection(db, 'quickbill_friends'), cleanData({
    userId:    user.uid,
    name:      data.name || '',
    phone:     data.phone || '',
    color:     data.color || colors[Math.floor(Math.random()*colors.length)],
    createdAt: new Date().toISOString()
  }));
  return docRef.id;
};

export const deleteFriend = async (id) => {
  getUser();
  await deleteDoc(doc(db, 'quickbill_friends', id));
};

// OUTINGS
export const getOutings = async () => {
  const user = getUser();
  const q = query(
    collection(db, 'quickbill_outings'),
    where('userId', '==', user.uid)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const addOuting = async (data) => {
  const user = getUser();
  const docRef = await addDoc(collection(db, 'quickbill_outings'), cleanData({
    userId:       user.uid,
    name:         data.name || 'Quick Bill',
    date:         data.date || new Date().toISOString(),
    totalAmount:  Number(data.totalAmount) || 0,
    paidBy:       data.paidBy || 'me',
    splitType:    data.splitType || 'equal',
    participants: data.participants || [],
    note:         data.note || '',
    createdAt:    new Date().toISOString()
  }));
  return docRef.id;
};

export const deleteOuting = async (id) => {
  getUser();
  await deleteDoc(doc(db, 'quickbill_outings', id));
};

// SETTLEMENTS
export const getSettlements = async () => {
  const user = getUser();
  const q = query(
    collection(db, 'quickbill_settlements'),
    where('userId', '==', user.uid)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const addQuickBillSettlement = async (data) => {
  const user = getUser();
  const docRef = await addDoc(collection(db, 'quickbill_settlements'), cleanData({
    userId:    user.uid,
    friendId:  data.friendId || '',
    amount:    Number(data.amount) || 0,
    direction: data.direction || 'they_paid_me',
    note:      data.note || '',
    date:      new Date().toISOString()
  }));
  return docRef.id;
};

export const deleteQuickBillSettlement = async (id) => {
  getUser();
  await deleteDoc(doc(db, 'quickbill_settlements', id));
};
