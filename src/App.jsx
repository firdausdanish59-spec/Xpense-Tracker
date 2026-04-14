import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import BudgetPlanner from './pages/BudgetPlanner';
import Analytics from './pages/Analytics';
import Subscriptions from './pages/Subscriptions';
import GroupSplit from './pages/GroupSplit';
import Goals from './pages/Goals';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import InstallPrompt from './components/InstallPrompt';
import OfflineBar from './components/OfflineBar';

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <OfflineBar />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Protected Routes */}
            <Route path="/*" element={
              <ProtectedRoute>
                <Routes>
                  <Route element={<AppLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="transactions" element={<Transactions />} />
                    <Route path="budget" element={<BudgetPlanner />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="subscriptions" element={<Subscriptions />} />
                    <Route path="split" element={<GroupSplit />} />
                    <Route path="goals" element={<Goals />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>
                </Routes>
              </ProtectedRoute>
            } />
          </Routes>
          <InstallPrompt />
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
