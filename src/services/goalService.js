import { db, auth } from '../config/firebase';
import {
  collection, addDoc, getDocs, doc,
  updateDoc, deleteDoc, query, where
} from 'firebase/firestore';
import { cleanData } from '../utils/firestore';

const COL = 'goals';

const getUser = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return user;
};

export const getGoals = async () => {
  const user = getUser();
  const q = query(
    collection(db, COL),
    where('userId', '==', user.uid)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const addGoal = async (data) => {
  const user = getUser();
  const docRef = await addDoc(collection(db, COL), cleanData({
    userId:        user.uid,
    name:          data.name || '',
    emoji:         data.emoji || '🎯',
    targetAmount:  Number(data.targetAmount) || 0,
    savedAmount:   Number(data.savedAmount) || 0,
    targetDate:    data.targetDate || '',
    category:      data.category || '',
    dailySaving:   Number(data.dailySaving) || 0,
    isCompleted:   false,
    createdAt:     new Date().toISOString()
  }));
  return docRef.id;
};

export const updateGoal = async (id, data) => {
  getUser();
  const newSaved = Number(data.savedAmount) || 0;
  const target = Number(data.targetAmount) || 0;
  await updateDoc(doc(db, COL, id), cleanData({
    ...data,
    savedAmount:  newSaved,
    targetAmount: target,
    isCompleted:  newSaved >= target,
    updatedAt:    new Date().toISOString()
  }));
};

export const deleteGoal = async (id) => {
  getUser();
  await deleteDoc(doc(db, COL, id));
};

export const contributeToGoal = async (id, amount, currentSaved, targetAmount) => {
  getUser();
  const newSaved = Number(currentSaved) + Number(amount);
  await updateDoc(doc(db, COL, id), cleanData({
    savedAmount: newSaved,
    isCompleted: newSaved >= Number(targetAmount),
    updatedAt:   new Date().toISOString()
  }));
};
