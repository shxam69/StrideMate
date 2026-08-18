import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Activity } from 'lucide-react';
import FloatingLabelInput from '../components/auth/FloatingLabelInput';
import EmailInput from '../components/auth/EmailInput';
import PhoneInput from '../components/auth/PhoneInput';
import PasswordInput from '../components/auth/PasswordInput';
const Register: React.FC = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        
        setIsLoading(true);
        setError('');
        
        try {
            const payload = {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim().toLowerCase(),
                phoneNumber: phoneNumber.trim().replace(/\s+/g, ""),
                password
            };
            await api.post('/auth/register', payload);
            
            // Navigate to email OTP verification screen without authenticating yet
            navigate('/verify-phone', { state: { email: payload.email, otpRequested: true } });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full glass-card overflow-hidden flex flex-col md:flex-row rounded-3xl">
            {/* Left Panel: Visual/Brand */}
            <div className="hidden md:flex md:w-1/2 p-12 flex-col justify-between relative overflow-hidden border-r border-white/10">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30 pointer-events-none">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-[var(--accent)] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
                    <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[var(--glow-purple)] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center space-x-3 mb-16">
                        <div className="bg-[var(--accent)]/20 p-2 rounded-xl border border-[var(--accent)]/40 shadow-[0_0_15px_var(--glow-purple)]">
                            <Activity className="w-8 h-8 text-[var(--accent)]" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-[var(--text)]">StrideMate</span>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-extrabold text-[var(--text)] tracking-tight leading-tight mb-6">
                        Build your<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-[var(--glow-purple)]">stronger stride.</span>
                    </h1>
                    <p className="text-lg text-white/70 max-w-md">
                        Create your StrideMate profile and start tracking your fitness journey with confidence.
                    </p>
                </div>
                <div className="relative z-10 space-y-6">
                    <div className="space-y-1">
                        <h3 className="font-semibold text-white/90">01 — Your profile</h3>
                        <p className="text-white/60 text-sm">Set up your personal fitness identity.</p>
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-semibold text-white/90">02 — Track your progress</h3>
                        <p className="text-white/60 text-sm">Build consistency through activity and performance tracking.</p>
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-semibold text-white/90">03 — Stay accountable</h3>
                        <p className="text-white/60 text-sm">Earn streaks and compete with the community.</p>
                    </div>
                    <div className="pt-8 border-t border-white/10">
                        <p className="text-white/50 text-sm italic">Your journey starts with one step.</p>
                    </div>
                </div>
            </div>
            {/* Right Panel: Register Form */}
            <div className="w-full md:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center relative">
                {/* Mobile Header (Hidden on Desktop) */}
                <div className="md:hidden flex items-center justify-center space-x-3 mb-8">
                    <div className="bg-[var(--accent)]/10 p-2 rounded-xl border border-[var(--accent)]/30 shadow-[0_0_15px_var(--glow-purple)]">
                        <Activity className="w-8 h-8 text-[var(--accent)]" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-[var(--text)]">StrideMate</span>
                </div>
                <div className="max-w-md w-full mx-auto">
                    <h2 className="text-3xl font-bold text-white mb-2">Start your journey.</h2>
                    <p className="text-white/60 mb-8">Create your StrideMate account and take the first step toward smarter fitness tracking.</p>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[var(--danger)] px-4 py-3 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-1">
                                {error}
                            </div>
                        )}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <FloatingLabelInput
                                label="First Name"
                                value={firstName}
                                onChange={e => setFirstName(e.target.value)}
                                required
                            />
                            <FloatingLabelInput
                                label="Last Name"
                                value={lastName}
                                onChange={e => setLastName(e.target.value)}
                                required
                            />
                        </div>
                        <EmailInput
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            placeholder="you@example.com"
                        />
                        <PhoneInput
                            value={phoneNumber}
                            onChange={setPhoneNumber}
                            required
                            placeholder="123 456 7890"
                        />

                        <PasswordInput
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />

                        <PasswordInput
                            label="Confirm Password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />

                        <div className="pt-2">
                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="auth-submit-btn h-12 w-full flex justify-center items-center font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    "Sign up"
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center text-sm border-t border-white/10 pt-6">
                        <span className="text-white/60">Already have an account? </span>
                        <Link to="/login" className="font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">Sign in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Register;
