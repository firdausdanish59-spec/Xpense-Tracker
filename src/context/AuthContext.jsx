import { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile
} from '../config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get extra user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          ...userDoc.data()
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Create user profile in Firestore
  const createUserProfile = async (firebaseUser, extraData = {}) => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || extraData.name || '',
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL || '',
        upiId: '',
        currency: 'INR',
        monthlyIncome: 0,
        theme: 'dark',
        createdAt: new Date().toISOString(),
        ...extraData
      });
    }
  };

  // REGISTER with Email + Password
  const register = async (name, email, password) => {
    setError('');
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name });
      await createUserProfile(result.user, { name });
      return result.user;
    } catch (err) {
      const msg = getErrorMessage(err.code);
      setError(msg);
      throw new Error(msg);
    }
  };

  // LOGIN with Email + Password
  const login = async (email, password) => {
    setError('');
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (err) {
      const msg = getErrorMessage(err.code);
      setError(msg);
      throw new Error(msg);
    }
  };

  // LOGIN with Google
  const loginWithGoogle = async () => {
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await createUserProfile(result.user);
      return result.user;
    } catch (err) {
      const msg = getErrorMessage(err.code);
      setError(msg);
      throw new Error(msg);
    }
  };

  // FORGOT PASSWORD
  const forgotPassword = async (email) => {
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      const msg = getErrorMessage(err.code);
      setError(msg);
      throw new Error(msg);
    }
  };

  // LOGOUT
  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  // FRIENDLY ERROR MESSAGES
  const getErrorMessage = (code) => {
    const messages = {
      'auth/email-already-in-use': 'This email is already registered. Please login.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Check your connection.',
      'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    };
    return messages[code] || 'Something went wrong. Please try again.';
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    loginWithGoogle,
    forgotPassword,
    logout,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
