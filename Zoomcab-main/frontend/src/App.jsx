import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Profile from './pages/Profile';
import MyRides from './pages/MyRides';
import Wallet from './pages/Wallet';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Home from './pages/Home';
import Payment from './pages/Payment';
import DriverDashboard from './pages/DriverDashboard';
import SavedPlaces from './pages/SavedPlaces';
import RidePreferences from './pages/RidePreferences';
import ScheduleRide from './pages/ScheduleRide';
import Rewards from './pages/Rewards';
import Referrals from './pages/Referrals';
import DriverEarnings from './pages/DriverEarnings';
import DriverStats from './pages/DriverStats';
import RideAcceptance from './pages/RideAcceptance';
import BreakScheduler from './pages/BreakScheduler';
import ExpenseTracker from './pages/ExpenseTracker';
import ActiveRideNavigation from './pages/ActiveRideNavigation';
import Concierge from './pages/Concierge';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/driver" element={<DriverDashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/rides" element={<MyRides />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/saved-places" element={<SavedPlaces />} />
        <Route path="/ride-preferences" element={<RidePreferences />} />
        <Route path="/schedule-ride" element={<ScheduleRide />} />
        <Route path="/rewards" element={<Rewards />} />
        <Route path="/referrals" element={<Referrals />} />
        <Route path="/driver-earnings" element={<DriverEarnings />} />
        <Route path="/driver-stats" element={<DriverStats />} />
        <Route path="/ride-acceptance" element={<RideAcceptance />} />
        <Route path="/break-scheduler" element={<BreakScheduler />} />
        <Route path="/expense-tracker" element={<ExpenseTracker />} />
        <Route path="/active-ride" element={<ActiveRideNavigation />} />
        <Route path="/concierge" element={<Concierge />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}

export default App;
