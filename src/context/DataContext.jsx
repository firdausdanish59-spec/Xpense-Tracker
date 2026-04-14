import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getTransactions, getMonthlySummary } from '../services/transactionService';
import { getGoals } from '../services/goalService';
import { getSubscriptions, getNextBill } from '../services/subscriptionService';
import { getCurrentBudget } from '../services/budgetService';
import { getGroups } from '../services/groupService';
import { getFriends, getOutings, getSettlements } from '../services/quickBillService';
import { getUserProfile } from '../services/userService';
import { migrateToFirestore } from '../utils/migrate';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const { user } = useAuth();

  const [transactions,  setTransactions]  = useState([]);
  const [goals,         setGoals]         = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [budget,        setBudget]        = useState(null);
  const [groups,        setGroups]        = useState([]);
  const [friends,       setFriends]       = useState([]);
  const [outings,       setOutings]       = useState([]);
  const [settlements,   setSettlements]   = useState([]);
  const [summary,       setSummary]       = useState({ income: 0, expense: 0, net: 0 });
  const [nextBill,      setNextBill]      = useState(null);
  const [userProfile,   setUserProfile]   = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [dataError,     setDataError]     = useState(null);

  // Helper: safely run a query, return fallback on failure
  const safeQuery = async (fn, fallback = []) => {
    try { return await fn(); } 
    catch (err) { 
      console.warn('Query failed (missing index?):', err.message);
      return fallback; 
    }
  };

  // Load ALL data when user logs in
  const loadAllData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. First, check if migration from localStorage is needed
      await migrateToFirestore();

      // 2. Load each collection independently — one failure won't block others
      const [
        txns, goalsData, subsData, budgetData,
        groupsData, friendsData, outingsData,
        settlementsData, summaryData, 
        nextBillData, profileData
      ] = await Promise.all([
        safeQuery(getTransactions),
        safeQuery(getGoals),
        safeQuery(getSubscriptions),
        safeQuery(getCurrentBudget, null),
        safeQuery(getGroups),
        safeQuery(getFriends),
        safeQuery(getOutings),
        safeQuery(getSettlements),
        safeQuery(getMonthlySummary, { income: 0, expense: 0, net: 0 }),
        safeQuery(getNextBill, null),
        safeQuery(getUserProfile, null)
      ]);

      setTransactions(txns);
      setGoals(goalsData);
      setSubscriptions(subsData);
      setBudget(budgetData);
      setGroups(groupsData);
      setFriends(friendsData);
      setOutings(outingsData);
      setSettlements(settlementsData);
      setSummary(summaryData);
      setNextBill(nextBillData);
      setUserProfile(profileData);
      setDataError(null);
    } catch (err) {
      console.error('Error loading data:', err);
      setDataError('LOAD_FAILED');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadAllData();
    } else {
      setLoading(false);
    }
  }, [user, loadAllData]);

  // REFRESH individual collections after mutations
  const refreshTransactions = async () => {
    const data = await getTransactions();
    const summaryData = await getMonthlySummary();
    setTransactions(data);
    setSummary(summaryData);
  };

  const refreshGoals = async () => {
    setGoals(await getGoals());
  };

  const refreshSubscriptions = async () => {
    setSubscriptions(await getSubscriptions());
    setNextBill(await getNextBill());
  };

  const refreshGroups = async () => {
    setGroups(await getGroups());
  };

  const refreshQuickBill = async () => {
    const [f, o, s] = await Promise.all([
      getFriends(), getOutings(), getSettlements()
    ]);
    setFriends(f);
    setOutings(o);
    setSettlements(s);
  };

  const refreshBudget = async () => {
    setBudget(await getCurrentBudget());
  };

  const refreshProfile = async () => {
    setUserProfile(await getUserProfile());
  };

  const value = {
    // Data
    transactions, goals, subscriptions,
    budget, groups, friends, outings,
    settlements, summary, nextBill, userProfile,
    loading,

    // Refresh functions
    refreshTransactions,
    refreshGoals,
    refreshSubscriptions,
    refreshGroups,
    refreshQuickBill,
    refreshBudget,
    refreshProfile,
    loadAllData,
    dataError
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
