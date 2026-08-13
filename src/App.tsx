import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import HomePage from '@/pages/HomePage';
import IssuesPage from '@/pages/IssuesPage';
import AgentPage from '@/pages/AgentPage';
import ComplaintTrackingPage from '@/pages/ComplaintTrackingPage';
import SettingsPage from '@/pages/SettingsPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/issues" element={<IssuesPage />} />
        <Route path="/agent" element={<AgentPage />} />
        <Route path="/complaint/:id" element={<ComplaintTrackingPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="relative min-h-screen bg-ink-950 text-gray-100">
        <Navbar />
        <main>
          <AnimatedRoutes />
        </main>
      </div>
    </BrowserRouter>
  );
}
