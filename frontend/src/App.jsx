import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { lazy, Suspense } from 'react';

const Landing = lazy(() => import('./landing/Landing'));
const Profile = lazy(() => import('./pages/Profile'));
const MyRides = lazy(() => import('./pages/MyRides'));
const Wallet = lazy(() => import('./pages/Wallet'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const Home = lazy(() => import('./pages/Home'));
const Payment = lazy(() => import('./pages/Payment'));
const DriverDashboard = lazy(() => import('./pages/DriverDashboard'));
const SavedPlaces = lazy(() => import('./pages/SavedPlaces'));
const RidePreferences = lazy(() => import('./pages/RidePreferences'));
const ScheduleRide = lazy(() => import('./pages/ScheduleRide'));
const Rewards = lazy(() => import('./pages/Rewards'));
const Referrals = lazy(() => import('./pages/Referrals'));
const DriverEarnings = lazy(() => import('./pages/DriverEarnings'));
const DriverStats = lazy(() => import('./pages/DriverStats'));
const RideAcceptance = lazy(() => import('./pages/RideAcceptance'));
const BreakScheduler = lazy(() => import('./pages/BreakScheduler'));
const ExpenseTracker = lazy(() => import('./pages/ExpenseTracker'));
const ActiveRideNavigation = lazy(() => import('./pages/ActiveRideNavigation'));
const Concierge = lazy(() => import('./pages/Concierge'));
const NotFound = lazy(() => import('./pages/NotFound'));

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
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
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <Suspense fallback={<div />}>
        <AnimatedRoutes />
      </Suspense>
    </Router>
  );
}

export default App;
