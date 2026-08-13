import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Activity } from 'lucide-react';

const Register: React.FC = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/register', { firstName, lastName, email, phoneNumber, password });
            login(res.data.token, res.data.user);
            navigate('/verify-phone', { state: { phoneNumber } });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative z-10">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="bg-[var(--accent)]/10 p-3 rounded-2xl border border-[var(--accent)]/30 shadow-[0_0_15px_var(--glow-purple)]">
                        <Activity className="w-10 h-10 text-[var(--accent)]" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-[var(--text)] tracking-tight">Create an account</h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
                <div className="glass-card py-8 px-5 sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[var(--danger)] px-4 py-3 rounded-xl text-sm font-medium">
                                {error}
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">First Name</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={firstName} 
                                    onChange={e => setFirstName(e.target.value)} 
                                    className="glass-input h-12" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Last Name</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={lastName} 
                                    onChange={e => setLastName(e.target.value)} 
                                    className="glass-input h-12" 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Email address</label>
                            <input 
                                type="email" 
                                required 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                className="glass-input h-12" 
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Phone (with code)</label>
                            <input 
                                type="tel" 
                                required 
                                value={phoneNumber} 
                                onChange={e => setPhoneNumber(e.target.value)} 
                                placeholder="+1234567890"
                                className="glass-input h-12" 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Password</label>
                            <input 
                                type="password" 
                                required 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                className="glass-input h-12" 
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="pt-2">
                            <button type="submit" className="glass-button h-12">
                                Sign up
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center text-sm border-t border-[var(--border)] pt-6">
                        <span className="text-[var(--text-muted)]">Already have an account? </span>
                        <Link to="/login" className="font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">Sign in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
