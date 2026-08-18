import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import OtpVerification from './pages/OtpVerification';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import AddActivity from './pages/AddActivity';
import ActivityHistory from './pages/ActivityHistory';
import Analytics from './pages/Analytics';
import AuthLayout from './layouts/AuthLayout';
import { ThemeProvider } from './context/ThemeContext';

// ProtectedRoute for standard app pages (requires auth + completed profile)
const ProtectedRoute = ({ children, allowIncomplete = false }: { children: React.ReactNode; allowIncomplete?: boolean }) => {
    const { user, loading } = useAuth();
    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-[var(--bg)]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--accent)]"></div>
            </div>
        );
    }
    if (!user) return <Navigate to="/login" replace />;
    
    // If profile is incomplete and route doesn't allow incomplete profiles, redirect to onboarding
    if (!user.profileCompleted && !allowIncomplete) {
        return <Navigate to="/onboarding" replace />;
    }

    return <>{children}</>;
};

// OnboardingRoute: requires auth, but redirects to dashboard if profile is already completed
const OnboardingRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();
    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-[var(--bg)]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--accent)]"></div>
            </div>
        );
    }
    if (!user) return <Navigate to="/login" replace />;
    if (user.profileCompleted) return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
};

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <AuthProvider>
                <div className="ambient-bg">
                    <div className="ambient-glow-purple"></div>
                    <div className="ambient-glow-blue"></div>
                </div>
                <Router>
                    <Routes>
                        <Route element={<AuthLayout />}>
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/reset-password" element={<ResetPassword />} />
                            <Route path="/verify-phone" element={<OtpVerification />} />
                            <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />
                        </Route>

                        {/* Profile & Settings (Accessible anytime when logged in) */}
                        <Route path="/profile" element={<ProtectedRoute allowIncomplete={true}><Profile /></ProtectedRoute>} />

                        {/* Core Protected App Routes */}
                        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/history" element={<ProtectedRoute><ActivityHistory /></ProtectedRoute>} />
                        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
                        <Route path="/add-activity" element={<ProtectedRoute><AddActivity /></ProtectedRoute>} />
                        <Route path="/" element={<Navigate to="/dashboard" />} />
                    </Routes>
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
};

export default App;
