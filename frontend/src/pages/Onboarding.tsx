import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ShieldCheck, ArrowRight, CheckCircle2, User as UserIcon, Phone, Mail, Sparkles } from 'lucide-react';

const AVATAR_PRESETS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
];

const RELATIONSHIPS = [
    'Spouse',
    'Parent',
    'Partner',
    'Sibling',
    'Friend',
    'Child',
    'Coach / Trainer',
    'Other',
];

const GENDERS = [
    'Male',
    'Female',
    'Non-Binary',
    'Prefer not to say',
    'Other',
];

const Onboarding: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Step 1: Personal Details
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [gender, setGender] = useState('');
    const [profilePhoto, setProfilePhoto] = useState('');
    const [customPhotoUrl, setCustomPhotoUrl] = useState('');

    // Step 2: Emergency Contact
    const [contactName, setContactName] = useState('');
    const [contactRelationship, setContactRelationship] = useState('Spouse');
    const [contactPhone, setContactPhone] = useState('');

    const handleStep1Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!dateOfBirth) {
            setError('Date of birth is required for fitness safety monitoring.');
            return;
        }

        // Validate reasonable age
        const dob = new Date(dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        if (isNaN(dob.getTime()) || dob > today || age < 10 || age > 120) {
            setError('Please enter a valid date of birth.');
            return;
        }

        setLoading(true);
        try {
            const photoToSave = customPhotoUrl.trim() || profilePhoto || undefined;

            await api.put('/users/me', {
                dateOfBirth,
                gender: gender || undefined,
                profilePhoto: photoToSave,
            });

            setStep(2);
        } catch (err: any) {
            console.error('Onboarding step 1 save failed', err);
            setError(err.response?.data?.message || 'Failed to save personal details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleStep2Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!contactName.trim()) {
            setError('Emergency contact name is required.');
            return;
        }
        if (!contactRelationship.trim()) {
            setError('Emergency contact relationship is required.');
            return;
        }
        if (!contactPhone.trim() || contactPhone.trim().length < 7) {
            setError('Please enter a valid emergency contact phone number.');
            return;
        }

        setLoading(true);
        try {
            // Save emergency contact
            await api.post('/emergency-contacts', {
                name: contactName.trim(),
                relationship: contactRelationship.trim(),
                phoneNumber: contactPhone.trim(),
                isPrimary: true,
            });

            // Refresh authenticated user in context (profileCompleted will now be true)
            await refreshUser();

            // Advance to completion step
            setStep(3);
        } catch (err: any) {
            console.error('Onboarding step 2 save failed', err);
            setError(err.response?.data?.message || 'Failed to save emergency contact. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = () => {
        navigate('/dashboard');
    };

    return (
        <div className="w-full max-w-xl flex flex-col items-center justify-center relative z-10 px-2 sm:px-0">
            {/* Stepper Progress */}
            <div className="w-full mb-6 sm:mb-8">
                <div className="flex items-center justify-between relative px-4">
                    <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-white/10 -z-0"></div>
                    <div 
                        className="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-[var(--accent)] to-[var(--glow-purple)] transition-all duration-500 -z-0"
                        style={{ width: step === 1 ? '0%' : step === 2 ? 'calc(50% - 12px)' : 'calc(100% - 24px)' }}
                    ></div>

                    <div className="flex flex-col items-center relative z-10">
                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 ${step >= 1 ? 'bg-[var(--accent)] text-white shadow-[0_0_12px_var(--glow-purple)]' : 'bg-[var(--surface-elevated)] border border-white/20 text-white/50'}`}>
                            {step > 1 ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : '1'}
                        </div>
                        <span className="text-[11px] sm:text-xs font-medium text-white/70 mt-1.5">Profile</span>
                    </div>

                    <div className="flex flex-col items-center relative z-10">
                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 ${step >= 2 ? 'bg-[var(--accent)] text-white shadow-[0_0_12px_var(--glow-purple)]' : 'bg-[var(--surface-elevated)] border border-white/20 text-white/50'}`}>
                            {step > 2 ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : '2'}
                        </div>
                        <span className="text-[11px] sm:text-xs font-medium text-white/70 mt-1.5">Emergency</span>
                    </div>

                    <div className="flex flex-col items-center relative z-10">
                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 ${step === 3 ? 'bg-[var(--success)] text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-[var(--surface-elevated)] border border-white/20 text-white/50'}`}>
                            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <span className="text-[11px] sm:text-xs font-medium text-white/70 mt-1.5">Ready</span>
                    </div>
                </div>
            </div>

            {/* Main Glass Card */}
            <div className="w-full glass-card rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl relative overflow-hidden">
                {/* Existing Account Context Badge (Read Only) */}
                {user && (
                    <div className="mb-6 p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-2.5 text-xs text-white/70">
                        <div className="flex items-center space-x-2">
                            <UserIcon className="w-3.5 h-3.5 text-[var(--accent)]" />
                            <span className="font-semibold text-white truncate max-w-[140px] sm:max-w-none">{user.firstName} {user.lastName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Mail className="w-3.5 h-3.5 text-white/40" />
                            <span className="truncate max-w-[160px] sm:max-w-none">{user.email}</span>
                        </div>
                        {user.phoneNumber && (
                            <div className="flex items-center space-x-2">
                                <Phone className="w-3.5 h-3.5 text-white/40" />
                                <span>{user.phoneNumber}</span>
                            </div>
                        )}
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-[var(--danger)]/15 border border-[var(--danger)]/30 text-[var(--danger)] text-sm font-medium animate-in fade-in slide-in-from-top-1">
                        {error}
                    </div>
                )}

                {/* STEP 1: Personal Details */}
                {step === 1 && (
                    <form onSubmit={handleStep1Submit} className="space-y-5 sm:space-y-6">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Complete your profile</h2>
                            <p className="text-white/60 text-xs sm:text-sm mt-1">Set up your safety and athlete details to personalize your tracking experience.</p>
                        </div>

                        {/* Date of Birth (Required) */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-white/90">
                                Date of Birth <span className="text-[var(--danger)]">*</span>
                            </label>
                            <input
                                type="date"
                                value={dateOfBirth}
                                onChange={(e) => setDateOfBirth(e.target.value)}
                                required
                                max={new Date().toISOString().split('T')[0]}
                                className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all [color-scheme:dark]"
                            />
                            <p className="text-[11px] sm:text-xs text-white/50">Required for accurate heart rate zones, calorie estimation, and safety profiles.</p>
                        </div>

                        {/* Gender (Optional) */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="block text-sm font-semibold text-white/90">Gender</label>
                                <span className="text-xs text-white/40 font-normal">Optional</span>
                            </div>
                            <select
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all [color-scheme:dark]"
                            >
                                <option value="" className="bg-[var(--bg)] text-white/60">Select gender (or leave blank)</option>
                                {GENDERS.map((g) => (
                                    <option key={g} value={g} className="bg-[var(--bg)] text-white">{g}</option>
                                ))}
                            </select>
                        </div>

                        {/* Profile Photo (Optional) */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="block text-sm font-semibold text-white/90">Choose an Avatar</label>
                                <span className="text-xs text-white/40 font-normal">Optional</span>
                            </div>
                            
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-3">
                                {AVATAR_PRESETS.map((url, idx) => {
                                    const isSelected = profilePhoto === url && !customPhotoUrl;
                                    return (
                                        <button
                                            type="button"
                                            key={idx}
                                            onClick={() => {
                                                setProfilePhoto(url);
                                                setCustomPhotoUrl('');
                                            }}
                                            className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-200 ${isSelected ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/50 scale-105 shadow-[0_0_12px_var(--glow-purple)]' : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'}`}
                                        >
                                            <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                                            {isSelected && (
                                                <div className="absolute inset-0 bg-[var(--accent)]/20 flex items-center justify-center">
                                                    <CheckCircle2 className="w-4 h-4 text-white drop-shadow" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="pt-1">
                                <input
                                    type="url"
                                    placeholder="Or paste custom image URL (optional)"
                                    value={customPhotoUrl}
                                    onChange={(e) => {
                                        setCustomPhotoUrl(e.target.value);
                                        setProfilePhoto('');
                                    }}
                                    className="w-full h-11 px-4 text-xs rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/30 focus:outline-none focus:border-[var(--accent)] transition-all"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="auth-submit-btn h-12 w-full flex justify-center items-center font-semibold text-base transition-all rounded-xl mt-6 group"
                        >
                            <span>Next: Emergency Contact</span>
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>
                )}

                {/* STEP 2: Emergency Contact */}
                {step === 2 && (
                    <form onSubmit={handleStep2Submit} className="space-y-5 sm:space-y-6">
                        <div>
                            <div className="flex items-center space-x-2 text-[var(--accent)] mb-1">
                                <ShieldCheck className="w-5 h-5" />
                                <span className="text-xs font-bold uppercase tracking-wider">Safety First</span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Emergency Contact</h2>
                            <p className="text-white/60 text-xs sm:text-sm mt-1">StrideMate alerts your trusted contact if abnormal telemetry or SOS triggers occur during an outdoor activity.</p>
                        </div>

                        {/* Contact Name */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-white/90">
                                Contact Name <span className="text-[var(--danger)]">*</span>
                            </label>
                            <input
                                type="text"
                                value={contactName}
                                onChange={(e) => setContactName(e.target.value)}
                                placeholder="e.g. Sarah Connor"
                                required
                                className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
                            />
                        </div>

                        {/* Relationship */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-white/90">
                                Relationship <span className="text-[var(--danger)]">*</span>
                            </label>
                            <select
                                value={contactRelationship}
                                onChange={(e) => setContactRelationship(e.target.value)}
                                required
                                className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all [color-scheme:dark]"
                            >
                                {RELATIONSHIPS.map((rel) => (
                                    <option key={rel} value={rel} className="bg-[var(--bg)] text-white">{rel}</option>
                                ))}
                            </select>
                        </div>

                        {/* Phone Number */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-white/90">
                                Contact Phone Number <span className="text-[var(--danger)]">*</span>
                            </label>
                            <input
                                type="tel"
                                value={contactPhone}
                                onChange={(e) => setContactPhone(e.target.value)}
                                placeholder="+1 555 123 4567"
                                required
                                className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
                            />
                        </div>

                        <div className="flex items-center space-x-3 sm:space-x-4 pt-4">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                disabled={loading}
                                className="h-12 px-5 sm:px-6 rounded-xl border border-white/15 text-white/80 hover:bg-white/5 font-medium transition-all"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="auth-submit-btn h-12 flex-1 flex justify-center items-center font-semibold text-base transition-all rounded-xl disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    'Complete Profile'
                                )}
                            </button>
                        </div>
                    </form>
                )}

                {/* STEP 3: Complete & Ready */}
                {step === 3 && (
                    <div className="text-center py-4 sm:py-6 space-y-5 sm:space-y-6 animate-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[var(--success)]/15 border border-[var(--success)]/30 text-[var(--success)] flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                            <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
                        </div>

                        <div>
                            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[var(--success)]/10 border border-[var(--success)]/30 text-[var(--success)] text-xs font-semibold mb-3">
                                <span className="w-2 h-2 rounded-full bg-[var(--success)]"></span>
                                <span>🟢 Profile Complete</span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">You're ready to stride!</h2>
                            <p className="text-white/60 text-xs sm:text-sm max-w-sm mx-auto mt-2">
                                Your safety profile is fully configured. You can now log activities, monitor heart rate, and track your global streaks.
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left space-y-2 text-xs text-white/80 max-w-md mx-auto">
                            <div className="flex justify-between">
                                <span className="text-white/50">Athlete:</span>
                                <span className="font-semibold text-white">{user?.firstName} {user?.lastName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/50">Date of Birth:</span>
                                <span className="font-medium text-white">{dateOfBirth}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/50">Primary Contact:</span>
                                <span className="font-medium text-white">{contactName} ({contactRelationship})</span>
                            </div>
                        </div>

                        <button
                            onClick={handleFinish}
                            className="auth-submit-btn h-12 w-full flex justify-center items-center font-semibold text-base transition-all rounded-xl shadow-lg"
                        >
                            <span>Go to Dashboard</span>
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Onboarding;
