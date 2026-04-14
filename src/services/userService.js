import { db, auth } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { cleanData } from '../utils/firestore';

const getUser = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return user;
};

// GET user profile
export const getUserProfile = async () => {
  const user = getUser();
  const ref  = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
};

// UPDATE user profile (called from Settings page)
// Using setDoc with merge to create doc if it doesn't exist yet
export const updateUserProfile = async (data) => {
  const user = getUser();
  await setDoc(doc(db, 'users', user.uid), cleanData({
    name:          data.name || '',
    upiId:         data.upiId || '',
    currency:      data.currency || '₹',
    monthlyIncome: Number(data.monthlyIncome) || 0,
    theme:         data.theme || 'dark',
    phone:         data.phone || '',
    updatedAt:     new Date().toISOString()
  }), { merge: true });
};
