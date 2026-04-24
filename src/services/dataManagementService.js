import { db, auth } from '../config/firebase';
import { collection, getDocs, query, where, deleteDoc, doc, writeBatch } from 'firebase/firestore';

const COLLECTIONS = [
  { name: 'transactions', field: 'userId' },
  { name: 'goals', field: 'userId' },
  { name: 'subscriptions', field: 'userId' },
  { name: 'budgets', field: 'userId' },
  { name: 'groups', field: 'createdBy' },
  { name: 'quickbill_friends', field: 'userId' },
  { name: 'quickbill_outings', field: 'userId' },
  { name: 'quickbill_settlements', field: 'userId' }
];

/**
 * Clears all data for the currently authenticated user from Firestore.
 */
export const clearAllUserData = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const userId = user.uid;

  for (const col of COLLECTIONS) {
    const q = query(collection(db, col.name), where(col.field, '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) continue;

    // Use batches for efficiency
    const batch = writeBatch(db);
    querySnapshot.forEach((document) => {
      batch.delete(doc(db, col.name, document.id));
    });
    
    await batch.commit();
  }

  // Finally, delete the user profile document
  await deleteDoc(doc(db, 'users', userId));
};
