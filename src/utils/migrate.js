import { addTransaction } from '../services/transactionService';
import { addGoal } from '../services/goalService';
import { addSubscription } from '../services/subscriptionService';
import { addGroup } from '../services/groupService';

export const migrateToFirestore = async () => {
  // Only run if not already migrated
  const isMigrated = localStorage.getItem('migrated_v2');
  if (isMigrated === 'true') return;

  console.log('🚀 Starting one-time migration to Firestore relational collections...');

  try {
    // 1. Migrate Transactions
    const localTxns = localStorage.getItem('expanse-transactions-storage');
    if (localTxns) {
      const { state } = JSON.parse(localTxns);
      const txns = state.transactions || [];
      for (const tx of txns) {
        await addTransaction(tx);
      }
    }

    // 2. Migrate Goals
    const localGoals = localStorage.getItem('expanse-goals-storage');
    if (localGoals) {
      const { state } = JSON.parse(localGoals);
      const goals = state.goals || [];
      for (const g of goals) {
        await addGoal(g);
      }
    }

    // 3. Migrate Subscriptions
    const localSubs = localStorage.getItem('expanse-subscriptions-storage');
    if (localSubs) {
      const { state } = JSON.parse(localSubs);
      const subs = state.subscriptions || [];
      for (const s of subs) {
        await addSubscription(s);
      }
    }

    // 4. Migrate Groups
    const localGroups = localStorage.getItem('expanse-groups-storage');
    if (localGroups) {
      const { state } = JSON.parse(localGroups);
      const groups = state.groups || [];
      for (const g of groups) {
        await addGroup(g);
      }
    }

    // Note: Budget and Profile are handled differently (single doc),
    // and QuickBill consists of multiple collections. 
    // We prioritize the core 4 for standard migration.

    localStorage.setItem('migrated_v2', 'true');
    console.log('✅ Migration to Firestore complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  }
};
