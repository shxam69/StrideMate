import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import { Activity, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';

const ResetPassword: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [tokenError, setTokenError] = useState(false);
    
    const location = useLocation();
    
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');

    useEffect(() => {
        if (!token) {
            setTokenError(true);
            setStatus('error');
            setMessage('Invalid or missing password reset token. Please request a new link.');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setStatus('error');
            setMessage('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setStatus('error');
            setMessage('Password must be at least 6 characters long');
            return;
        }

        setStatus('loading');
        setMessage('');

        try {
            await api.post('/auth/reset-password', { 
                token, 
                newPassword: password 
            });
            setStatus('success');
            setMessage('Your password has been successfully reset. You can now log in with your new password.');
        } catch (err: any) {
            setStatus('error');
            setMessage(err.response?.data?.message || err.response?.data || 'The reset link is invalid or has expired. Please request a new one.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
            <div className="w-full max-w-md glass-card p-8 sm:p-10 relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-[var(--border)] rounded-2xl">
                
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-[var(--accent)] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="flex justify-center mb-6">
                        <div className="bg-[var(--accent)]/10 p-3 rounded-2xl border border-[var(--accent)]/30 shadow-[0_0_15px_var(--glow-purple)]">
                            <Activity className="w-10 h-10 text-[var(--accent)]" />
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-center text-[var(--text)] tracking-tight mb-2">Create New Password</h2>
                    
                    {status === 'success' ? (
                        <div className="text-center mt-6 space-y-6">
                            <div className="flex justify-center">
                                <CheckCircle2 className="w-16 h-16 text-[var(--accent)]" />
                            </div>
                            <p className="text-[var(--text-muted)]">
                                {message}
                            </p>
                            <div className="pt-4">
                                <Link to="/login" className="glass-button h-12 w-full flex justify-center items-center font-medium shadow-[0_0_15px_var(--accent)]">
                                    Sign In
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="text-center text-[var(--text-muted)] mb-8">
                                Enter your new password below.
                            </p>

                            <form className="space-y-5" onSubmit={handleSubmit}>
                                {status === 'error' && (
                                    <div className="bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[var(--danger)] px-4 py-3 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-1">
                                        {message}
                                    </div>
                                )}
                                
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-[var(--text-muted)]">New Password</label>
                                    <div className="relative">
                                        <input 
                                            type={showPassword ? "text" : "password"} 
                                            required 
                                            disabled={tokenError || status === 'loading'}
                                            value={password} 
                                            onChange={e => setPassword(e.target.value)} 
                                            className="glass-input h-12 w-full pl-10 pr-10 transition-all duration-200 focus:ring-2 focus:ring-[var(--accent)]/50 disabled:opacity-50" 
                                            placeholder="••••••••"
                                        />
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                                            <Lock className="h-5 w-5" />
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => setShowPassword(!showPassword)}
                                            disabled={tokenError}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors focus:outline-none"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-[var(--text-muted)]">Confirm Password</label>
                                    <div className="relative">
                                        <input 
                                            type={showConfirmPassword ? "text" : "password"} 
                                            required 
                                            disabled={tokenError || status === 'loading'}
                                            value={confirmPassword} 
                                            onChange={e => setConfirmPassword(e.target.value)} 
                                            className="glass-input h-12 w-full pl-10 pr-10 transition-all duration-200 focus:ring-2 focus:ring-[var(--accent)]/50 disabled:opacity-50" 
                                            placeholder="••••••••"
                                        />
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                                            <Lock className="h-5 w-5" />
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            disabled={tokenError}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors focus:outline-none"
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button 
                                        type="submit" 
                                        disabled={tokenError || status === 'loading'}
                                        className="glass-button h-12 w-full flex justify-center items-center font-semibold text-lg shadow-[0_0_15px_var(--accent)] hover:shadow-[0_0_25px_var(--accent)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {status === 'loading' ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            "Reset Password"
                                        )}
                                    </button>
                                </div>
                            </form>

                            <div className="mt-8 text-center">
                                <Link to="/login" className="inline-flex items-center text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to login
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
