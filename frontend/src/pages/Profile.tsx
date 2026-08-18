import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../services/api';
import type { EmergencyContact } from '../types';
import { ShieldCheck, User as UserIcon, Calendar, Plus, Trash2, Edit3, CheckCircle2, AlertCircle, Save, X, Heart, ShieldAlert } from 'lucide-react';

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

const AVATAR_PRESETS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
];

const Profile: React.FC = () => {
    const { user, updateUser } = useAuth();

    // Personal details state
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [gender, setGender] = useState('');
    const [profilePhoto, setProfilePhoto] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Emergency contacts state
    const [contacts, setContacts] = useState<EmergencyContact[]>([]);
    const [loadingContacts, setLoadingContacts] = useState(true);

    // Modal state for Add/Edit Contact
    const [showContactModal, setShowContactModal] = useState(false);
    const [editingContactId, setEditingContactId] = useState<string | null>(null);
    const [modalName, setModalName] = useState('');
    const [modalRelationship, setModalRelationship] = useState('Spouse');
    const [modalPhone, setModalPhone] = useState('');
    const [modalIsPrimary, setModalIsPrimary] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState('');

    const syncLatestUserProfile = async () => {
        try {
            const res = await api.get('/users/me');
            updateUser(res.data);
            setDateOfBirth(res.data.dateOfBirth || '');
            setGender(res.data.gender || '');
            setProfilePhoto(res.data.profilePhoto || '');
        } catch (err) {
            console.error('Failed to sync profile', err);
        }
    };

    useEffect(() => {
        syncLatestUserProfile();
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
            const res = await api.get('/emergency-contacts');
            setContacts(res.data);
        } catch (err) {
            console.error('Failed to fetch emergency contacts', err);
        } finally {
            setLoadingContacts(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileMsg(null);
        setIsSavingProfile(true);

        try {
            const res = await api.put('/users/me', {
                dateOfBirth: dateOfBirth || null,
                gender: gender || null,
                profilePhoto: profilePhoto || null,
            });
            updateUser(res.data);
            setProfileMsg({ type: 'success', text: 'Personal details updated successfully.' });
        } catch (err: any) {
            setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleOpenAddModal = () => {
        setEditingContactId(null);
        setModalName('');
        setModalRelationship('Spouse');
        setModalPhone('');
        setModalIsPrimary(contacts.length === 0);
        setModalError('');
        setShowContactModal(true);
    };

    const handleOpenEditModal = (c: EmergencyContact) => {
        setEditingContactId(c.id);
        setModalName(c.name);
        setModalRelationship(c.relationship);
        setModalPhone(c.phoneNumber);
        setModalIsPrimary(c.isPrimary);
        setModalError('');
        setShowContactModal(true);
    };

    const handleSaveContactModal = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalError('');

        if (!modalName.trim() || !modalRelationship.trim() || !modalPhone.trim()) {
            setModalError('All fields are required.');
            return;
        }

        setModalLoading(true);
        try {
            if (editingContactId) {
                await api.put(`/emergency-contacts/${editingContactId}`, {
                    name: modalName.trim(),
                    relationship: modalRelationship.trim(),
                    phoneNumber: modalPhone.trim(),
                    isPrimary: modalIsPrimary,
                });
            } else {
                await api.post('/emergency-contacts', {
                    name: modalName.trim(),
                    relationship: modalRelationship.trim(),
                    phoneNumber: modalPhone.trim(),
                    isPrimary: modalIsPrimary,
                });
            }

            await fetchContacts();
            await syncLatestUserProfile();
            setShowContactModal(false);
        } catch (err: any) {
            setModalError(err.response?.data?.message || 'Failed to save emergency contact.');
        } finally {
            setModalLoading(false);
        }
    };

    const handleDeleteContact = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this emergency contact?')) return;

        try {
            await api.delete(`/emergency-contacts/${id}`);
            await fetchContacts();
            await syncLatestUserProfile();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete emergency contact.');
        }
    };

    if (!user) return null;

    const isComplete = Boolean(user.profileCompleted);

    return (
        <div className="min-h-screen pb-16 relative">
            <Navbar />

            {/* Subtle Ambient Decorative Elements behind Profile */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none -z-0 overflow-hidden opacity-40">
                <div className="absolute top-12 left-10 w-80 h-80 bg-[var(--accent)]/15 rounded-full filter blur-3xl"></div>
                <div className="absolute top-24 right-10 w-96 h-96 bg-[var(--glow-purple)]/20 rounded-full filter blur-3xl"></div>
            </div>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
                {/* Profile Header & Completion Status Banner */}
                <div className="mb-6 sm:mb-8 p-5 sm:p-8 rounded-3xl glass-card border border-white/10 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-6 shadow-xl">
                    <div className="flex items-center space-x-4 sm:space-x-5">
                        <div className="relative shrink-0">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-[var(--accent)]/50 bg-[var(--accent)]/10 shadow-[0_0_20px_var(--glow-purple)] flex items-center justify-center">
                                {profilePhoto ? (
                                    <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--accent)]" />
                                )}
                            </div>
                            <span 
                                className={`absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-[var(--bg)] flex items-center justify-center ${isComplete ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'}`}
                                title={isComplete ? 'Profile complete' : 'Profile incomplete'}
                            ></span>
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                                <h1 className="text-xl sm:text-3xl font-bold text-white tracking-tight truncate">
                                    {user.firstName} {user.lastName}
                                </h1>
                            </div>
                            <p className="text-white/60 text-xs sm:text-sm truncate">{user.email}</p>
                        </div>
                    </div>

                    {/* Completion Status Badge */}
                    <div className="flex flex-col sm:items-end pt-2 sm:pt-0 border-t border-white/10 sm:border-t-0">
                        {isComplete ? (
                            <div className="inline-flex items-center space-x-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-semibold shadow-[0_0_15px_rgba(16,185,129,0.15)] self-start sm:self-auto">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                                <span>🟢 Profile complete</span>
                            </div>
                        ) : (
                            <div className="inline-flex items-center space-x-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-semibold shadow-[0_0_15px_rgba(245,158,11,0.15)] self-start sm:self-auto">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse"></span>
                                <span>🟡 Profile incomplete</span>
                            </div>
                        )}
                        <p className="text-[11px] sm:text-xs text-white/50 mt-1.5 sm:text-right">
                            {isComplete 
                                ? 'All required safety & athlete details verified.' 
                                : 'Add Date of Birth & at least 1 Emergency Contact to complete.'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                    {/* Left Column: Account & Personal Details (7 Cols on desktop, 1 col full-width on mobile) */}
                    <div className="lg:col-span-7 space-y-6 sm:space-y-8 w-full">
                        {/* Section 1: Account Identity (Read-only) */}
                        <div className="p-5 sm:p-8 rounded-3xl glass-card border border-white/10 w-full">
                            <div className="flex items-center space-x-3 mb-5 sm:mb-6">
                                <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-[var(--accent)]">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base sm:text-lg font-bold text-white">Account Identity</h2>
                                    <p className="text-xs text-white/50">Core account details registered with StrideMate.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                                <div className="p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                                    <span className="text-xs text-white/40 block">First Name</span>
                                    <span className="font-semibold text-white truncate block">{user.firstName}</span>
                                </div>
                                <div className="p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                                    <span className="text-xs text-white/40 block">Last Name</span>
                                    <span className="font-semibold text-white truncate block">{user.lastName}</span>
                                </div>
                                <div className="p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                                    <span className="text-xs text-white/40 block">Email Address</span>
                                    <div className="flex items-center space-x-1.5 overflow-hidden">
                                        <span className="font-medium text-white truncate">{user.email}</span>
                                        <span title="Verified">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                                    <span className="text-xs text-white/40 block">Phone Number</span>
                                    <span className="font-medium text-white truncate block">{user.phoneNumber || 'Not registered'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Personal & Athlete Details (Editable) */}
                        <div className="p-5 sm:p-8 rounded-3xl glass-card border border-white/10 w-full">
                            <div className="flex items-center space-x-3 mb-5 sm:mb-6">
                                <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-[var(--accent)]">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base sm:text-lg font-bold text-white">Personal Details</h2>
                                    <p className="text-xs text-white/50">Edit your date of birth, gender, and avatar.</p>
                                </div>
                            </div>

                            {profileMsg && (
                                <div className={`mb-5 p-3.5 sm:p-4 rounded-xl text-xs sm:text-sm font-medium flex items-center space-x-2 ${profileMsg.type === 'success' ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400' : 'bg-[var(--danger)]/15 border border-[var(--danger)]/30 text-[var(--danger)]'}`}>
                                    {profileMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                                    <span>{profileMsg.text}</span>
                                </div>
                            )}

                            <form onSubmit={handleSaveProfile} className="space-y-4 sm:space-y-5">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="block text-xs sm:text-sm font-semibold text-white/90">
                                            Date of Birth <span className="text-[var(--danger)]">*</span>
                                        </label>
                                        {!dateOfBirth && (
                                            <span className="text-[11px] sm:text-xs text-amber-400 font-medium">Required for completion</span>
                                        )}
                                    </div>
                                    <input
                                        type="date"
                                        value={dateOfBirth}
                                        onChange={(e) => setDateOfBirth(e.target.value)}
                                        required
                                        max={new Date().toISOString().split('T')[0]}
                                        className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all [color-scheme:dark]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs sm:text-sm font-semibold text-white/90">Gender (Optional)</label>
                                    <select
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                        className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all [color-scheme:dark]"
                                    >
                                        <option value="" className="bg-[var(--bg)] text-white/60">Not specified</option>
                                        {GENDERS.map((g) => (
                                            <option key={g} value={g} className="bg-[var(--bg)] text-white">{g}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-3 pt-1 sm:pt-2">
                                    <label className="block text-xs sm:text-sm font-semibold text-white/90">Avatar / Profile Photo</label>
                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-3">
                                        {AVATAR_PRESETS.map((url, idx) => {
                                            const isSelected = profilePhoto === url;
                                            return (
                                                <button
                                                    type="button"
                                                    key={idx}
                                                    onClick={() => setProfilePhoto(url)}
                                                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${isSelected ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/50 scale-105' : 'border-white/10 hover:border-white/30 opacity-60 hover:opacity-100'}`}
                                                >
                                                    <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <input
                                        type="url"
                                        placeholder="Or paste custom image URL"
                                        value={profilePhoto}
                                        onChange={(e) => setProfilePhoto(e.target.value)}
                                        className="w-full h-11 px-4 text-xs rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/30 focus:outline-none focus:border-[var(--accent)] transition-all"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSavingProfile}
                                    className="auth-submit-btn h-12 w-full sm:w-auto px-6 rounded-xl flex items-center justify-center space-x-2 font-semibold text-sm transition-all disabled:opacity-50 mt-2"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{isSavingProfile ? 'Saving...' : 'Save Personal Details'}</span>
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right Column: Emergency Contacts (5 Cols on desktop, 1 col full-width on mobile) */}
                    <div className="lg:col-span-5 space-y-6 w-full">
                        <div className="p-5 sm:p-8 rounded-3xl glass-card border border-white/10 h-full flex flex-col justify-between w-full">
                            <div>
                                <div className="flex items-center justify-between mb-5 sm:mb-6">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-[var(--accent)]">
                                            <Heart className="w-5 h-5 text-[var(--danger)]" />
                                        </div>
                                        <div>
                                            <h2 className="text-base sm:text-lg font-bold text-white">Emergency Contacts</h2>
                                            <p className="text-xs text-white/50">Required for athlete safety telemetry.</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleOpenAddModal}
                                        className="p-2 sm:p-2.5 rounded-xl bg-[var(--accent)]/20 border border-[var(--accent)]/40 hover:bg-[var(--accent)]/30 text-[var(--accent)] transition-all"
                                        title="Add Emergency Contact"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>

                                {contacts.length === 0 && !loadingContacts && (
                                    <div className="p-5 sm:p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-3 mb-5">
                                        <ShieldAlert className="w-8 h-8 text-amber-400 mx-auto" />
                                        <div>
                                            <p className="text-sm font-semibold text-amber-300">No emergency contact on file</p>
                                            <p className="text-xs text-white/60 mt-1">At least 1 emergency contact is required to complete your profile.</p>
                                        </div>
                                        <button
                                            onClick={handleOpenAddModal}
                                            className="px-4 py-2 rounded-xl bg-amber-400 text-black font-semibold text-xs hover:bg-amber-300 transition-colors w-full sm:w-auto"
                                        >
                                            Add Contact Now
                                        </button>
                                    </div>
                                )}

                                {loadingContacts ? (
                                    <div className="py-10 flex justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {contacts.map((c) => (
                                            <div
                                                key={c.id}
                                                className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex items-center justify-between group gap-3"
                                            >
                                                <div className="space-y-1 min-w-0 flex-1">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-semibold text-white text-sm truncate">{c.name}</span>
                                                        {c.isPrimary && (
                                                            <span className="px-2 py-0.5 rounded-full bg-[var(--accent)]/20 border border-[var(--accent)]/40 text-[var(--accent)] text-[10px] font-bold uppercase shrink-0">
                                                                Primary
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-white/50 truncate">{c.relationship} • {c.phoneNumber}</p>
                                                </div>

                                                <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
                                                    <button
                                                        onClick={() => handleOpenEditModal(c)}
                                                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                                                        title="Edit contact"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteContact(c.id)}
                                                        className="p-2 rounded-lg bg-white/5 hover:bg-[var(--danger)]/20 text-white/50 hover:text-[var(--danger)] transition-colors"
                                                        title="Delete contact"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 sm:mt-8 pt-4 border-t border-white/10 text-xs text-white/40">
                                💡 Tip: StrideMate contacts will only be notified if an automated crash or emergency SOS is triggered during workout tracking.
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal for Add / Edit Emergency Contact (Fully responsive) */}
            {showContactModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
                    <div className="w-full max-w-md glass-card rounded-3xl p-5 sm:p-8 border border-white/15 shadow-2xl relative my-auto">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg sm:text-xl font-bold text-white">
                                {editingContactId ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
                            </h3>
                            <button
                                onClick={() => setShowContactModal(false)}
                                className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {modalError && (
                            <div className="mb-4 p-3 rounded-xl bg-[var(--danger)]/15 border border-[var(--danger)]/30 text-[var(--danger)] text-xs font-medium">
                                {modalError}
                            </div>
                        )}

                        <form onSubmit={handleSaveContactModal} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-white/80">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Johnathan Doe"
                                    value={modalName}
                                    onChange={(e) => setModalName(e.target.value)}
                                    className="w-full h-11 px-4 text-sm rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/30 focus:outline-none focus:border-[var(--accent)]"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-white/80">Relationship</label>
                                <select
                                    value={modalRelationship}
                                    onChange={(e) => setModalRelationship(e.target.value)}
                                    className="w-full h-11 px-4 text-sm rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-[var(--accent)] [color-scheme:dark]"
                                >
                                    {RELATIONSHIPS.map((rel) => (
                                        <option key={rel} value={rel} className="bg-[var(--bg)] text-white">{rel}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-white/80">Phone Number</label>
                                <input
                                    type="tel"
                                    required
                                    placeholder="+1 555 000 0000"
                                    value={modalPhone}
                                    onChange={(e) => setModalPhone(e.target.value)}
                                    className="w-full h-11 px-4 text-sm rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/30 focus:outline-none focus:border-[var(--accent)]"
                                />
                            </div>

                            <div className="flex items-center space-x-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="isPrimaryContact"
                                    checked={modalIsPrimary}
                                    onChange={(e) => setModalIsPrimary(e.target.checked)}
                                    className="w-4 h-4 rounded border-white/20 bg-white/10 text-[var(--accent)] focus:ring-[var(--accent)]"
                                />
                                <label htmlFor="isPrimaryContact" className="text-xs text-white/80 font-medium">
                                    Set as primary emergency contact
                                </label>
                            </div>

                            <div className="flex items-center space-x-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowContactModal(false)}
                                    disabled={modalLoading}
                                    className="h-11 px-5 rounded-xl border border-white/15 text-white/70 hover:bg-white/5 text-sm font-medium transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={modalLoading}
                                    className="auth-submit-btn h-11 flex-1 rounded-xl flex items-center justify-center font-semibold text-sm transition-all"
                                >
                                    {modalLoading ? 'Saving...' : editingContactId ? 'Update Contact' : 'Save Contact'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
