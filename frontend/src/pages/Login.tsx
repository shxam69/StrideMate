import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Activity, Eye, EyeOff, ShieldCheck, TrendingUp, Users } from 'lucide-react';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/login', { email, password });
            login(res.data.token, res.data.user);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid credentials');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
            <div className="w-full max-w-6xl glass-card overflow-hidden flex flex-col md:flex-row shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-[var(--border)] rounded-2xl">
                
                {/* Left Panel: Visual/Brand */}
                <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[var(--accent)]/10 to-[var(--glow-purple)]/20 p-12 flex-col justify-between relative overflow-hidden border-r border-[var(--border)]">
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
                            Your fitness journey,<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-[var(--glow-purple)]">safely tracked.</span>
                        </h1>
                        <p className="text-lg text-[var(--text-muted)] max-w-md">
                            Join the community of athletes who prioritize safety and performance. Track activities, earn streaks, and compete globally.
                        </p>
                    </div>

                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center space-x-4 text-[var(--text-muted)]">
                            <div className="bg-[var(--accent)]/10 p-2 rounded-lg border border-[var(--accent)]/20">
                                <ShieldCheck className="w-5 h-5 text-[var(--accent)]" />
                            </div>
                            <span>Secure OTP verification</span>
                        </div>
                        <div className="flex items-center space-x-4 text-[var(--text-muted)]">
                            <div className="bg-[var(--accent)]/10 p-2 rounded-lg border border-[var(--accent)]/20">
                                <TrendingUp className="w-5 h-5 text-[var(--accent)]" />
                            </div>
                            <span>Advanced activity scoring</span>
                        </div>
                        <div className="flex items-center space-x-4 text-[var(--text-muted)]">
                            <div className="bg-[var(--accent)]/10 p-2 rounded-lg border border-[var(--accent)]/20">
                                <Users className="w-5 h-5 text-[var(--accent)]" />
                            </div>
                            <span>Global leaderboards</span>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Login Form */}
                <div className="w-full md:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center relative bg-[var(--bg)]/50 backdrop-blur-sm">
                    {/* Mobile Header (Hidden on Desktop) */}
                    <div className="md:hidden flex items-center justify-center space-x-3 mb-8">
                        <div className="bg-[var(--accent)]/10 p-2 rounded-xl border border-[var(--accent)]/30 shadow-[0_0_15px_var(--glow-purple)]">
                            <Activity className="w-8 h-8 text-[var(--accent)]" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-[var(--text)]">StrideMate</span>
                    </div>

                    <div className="max-w-md w-full mx-auto">
                        <h2 className="text-3xl font-bold text-[var(--text)] mb-2">Welcome back</h2>
                        <p className="text-[var(--text-muted)] mb-8">Enter your credentials to access your account.</p>

                        <form className="space-y-5" onSubmit={handleSubmit}>
                            {error && (
                                <div className="bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[var(--danger)] px-4 py-3 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-1">
                                    {error}
                                </div>
                            )}
                            
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-[var(--text-muted)]">Email address</label>
                                <input 
                                    type="email" 
                                    required 
                                    value={email} 
                                    onChange={e => setEmail(e.target.value)} 
                                    className="glass-input h-12 w-full transition-all duration-200 focus:ring-2 focus:ring-[var(--accent)]/50" 
                                    placeholder="you@example.com"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-medium text-[var(--text-muted)]">Password</label>
                                    <Link to="/forgot-password" className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        required 
                                        value={password} 
                                        onChange={e => setPassword(e.target.value)} 
                                        className="glass-input h-12 w-full pr-10 transition-all duration-200 focus:ring-2 focus:ring-[var(--accent)]/50" 
                                        placeholder="••••••••"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors focus:outline-none"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className="glass-button h-12 w-full flex justify-center items-center font-semibold text-lg shadow-[0_0_15px_var(--accent)] hover:shadow-[0_0_25px_var(--accent)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        "Sign In"
                                    )}
                                </button>
                            </div>
                        </form>

                        <div className="mt-8 pt-6 text-center text-sm border-t border-[var(--border)]">
                            <span className="text-[var(--text-muted)]">Don't have an account? </span>
                            <Link to="/register" className="font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
                                Sign up for free
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
