import { db, auth } from '../config/firebase';
import {
  collection, getDocs, doc, setDoc,
  query, where
} from 'firebase/firestore';
import { cleanData } from '../utils/firestore';

const COL = 'budgets';

const getUser = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return user;
};

const getCurrentMonth = () => {
  const now = new Date();
  const mm  = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${mm}`;
};

const getBudgetId = () => {
  return `${getUser().uid}_${getCurrentMonth()}`;
};

const getDefaultBudget = () => ({
  month: getCurrentMonth(),
  userId: getUser().uid,
  categories: [
    { name: 'Food 🍔', budget: 8000, allocated: 8000, spent: 0 },
    { name: 'Transport 🚗', budget: 5000, allocated: 5000, spent: 0 },
    { name: 'Shopping 🛍️', budget: 5000, allocated: 5000, spent: 0 },
    { name: 'Entertainment 🎬', budget: 3000, allocated: 3000, spent: 0 },
    { name: 'Health ⚕️', budget: 2000, allocated: 2000, spent: 0 },
    { name: 'Bills 🧾', budget: 5000, allocated: 5000, spent: 0 },
    { name: 'Education 📚', budget: 2000, allocated: 2000, spent: 0 },
    { name: 'Other 🧩', budget: 3000, allocated: 3000, spent: 0 },
  ]
});

export const getCurrentBudget = async () => {
  const user = getUser();
  const q = query(
    collection(db, COL),
    where('userId', '==', user.uid),
    where('month', '==', getCurrentMonth())
  );
  const snap = await getDocs(q);
  if (snap.empty) return getDefaultBudget();
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
};

export const saveBudget = async (categories) => {
  const user = getUser();
  const id = getBudgetId();
  await setDoc(doc(db, COL, id), cleanData({
    userId: user.uid,
    month: getCurrentMonth(),
    categories,
    updatedAt: new Date().toISOString()
  }));
};

export const updateBudgetLimit = async (index, newLimit) => {
  const budget = await getCurrentBudget();
  const updatedCategories = [...budget.categories];
  const idx = typeof index === 'number' ? index : updatedCategories.findIndex(c => c.id === index);
  if (idx !== -1) {
    updatedCategories[idx].allocated = Number(newLimit) || 0;
    await saveBudget(updatedCategories);
  }
};

export const toggleFestivalMode = async (currentStatus) => {
  const user = getUser();
  const userRef = doc(db, 'users', user.uid);
  await setDoc(userRef, { festivalMode: !currentStatus }, { merge: true });
};
