import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Activity, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            const res = await api.post('/auth/forgot-password', { email });
            setStatus('success');
            setMessage(res.data || 'If an account exists for this email, a password reset link has been sent.');
        } catch (err: any) {
            // We should still show success visually for unknown emails if backend returns 200 generic success.
            // But if there's a 429 or 400 validation error, we show it.
            setStatus('error');
            setMessage(err.response?.data?.message || 'An error occurred. Please try again later.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
            <div className="w-full max-w-md glass-card p-8 sm:p-10 relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-[var(--border)] rounded-2xl">
                
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--glow-purple)] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="flex justify-center mb-6">
                        <div className="bg-[var(--accent)]/10 p-3 rounded-2xl border border-[var(--accent)]/30 shadow-[0_0_15px_var(--glow-purple)]">
                            <Activity className="w-10 h-10 text-[var(--accent)]" />
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-center text-[var(--text)] tracking-tight mb-2">Reset Password</h2>
                    
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
                                    Return to Login
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="text-center text-[var(--text-muted)] mb-8">
                                Enter your email address and we'll send you a link to reset your password.
                            </p>

                            <form className="space-y-6" onSubmit={handleSubmit}>
                                {status === 'error' && (
                                    <div className="bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[var(--danger)] px-4 py-3 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-1">
                                        {message}
                                    </div>
                                )}
                                
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-[var(--text-muted)]">Email address</label>
                                    <div className="relative">
                                        <input 
                                            type="email" 
                                            required 
                                            value={email} 
                                            onChange={e => setEmail(e.target.value)} 
                                            className="glass-input h-12 w-full pl-10 transition-all duration-200 focus:ring-2 focus:ring-[var(--accent)]/50" 
                                            placeholder="you@example.com"
                                        />
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                                            <Mail className="h-5 w-5" />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button 
                                        type="submit" 
                                        disabled={status === 'loading'}
                                        className="glass-button h-12 w-full flex justify-center items-center font-semibold text-lg shadow-[0_0_15px_var(--accent)] hover:shadow-[0_0_25px_var(--accent)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {status === 'loading' ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            "Send Reset Link"
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

export default ForgotPassword;
