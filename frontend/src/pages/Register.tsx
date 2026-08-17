import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
    const { login } = useAuth();
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
            const response = await api.post('/auth/register', payload);
            
            // Log in the user immediately with the returned token
            login(response.data.token, response.data.user);
            
            // Proceed to phone verification (but actually it's email verification now)
            navigate('/verify-phone', { state: { email: payload.email } });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full flex flex-col justify-center">
            <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
                <div className="flex justify-center">
                    <div className="bg-[var(--accent)]/20 p-3 rounded-2xl border border-[var(--accent)]/40 shadow-[0_0_15px_var(--glow-purple)]">
                        <Activity className="w-10 h-10 text-[var(--accent)]" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">Create an account</h2>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
                <div className="glass-card py-8 px-5 sm:px-10 rounded-3xl">
                    <form className="space-y-6" onSubmit={handleSubmit}>
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
