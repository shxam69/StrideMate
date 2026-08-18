import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { getAvatarUrl } from '../utils/avatar';
import type { EmergencyContact } from '../types';
import { 
    ShieldCheck, 
    Calendar, 
    Plus, 
    Trash2, 
    Edit3, 
    CheckCircle2, 
    AlertCircle, 
    Save, 
    X, 
    Heart, 
    ShieldAlert, 
    Upload, 
    Image as ImageIcon, 
    Check, 
    RefreshCw 
} from 'lucide-react';

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

export interface AnimalAvatar {
    id: string;
    name: string;
    icon: string;
    path: string;
}

export const ANIMAL_AVATARS: AnimalAvatar[] = [
    { id: 'fox', name: 'Fox', icon: '🦊', path: '/avatars/fox.svg' },
    { id: 'panda', name: 'Panda', icon: '🐼', path: '/avatars/panda.svg' },
    { id: 'cat', name: 'Cat', icon: '🐱', path: '/avatars/cat.svg' },
    { id: 'dog', name: 'Dog', icon: '🐶', path: '/avatars/dog.svg' },
    { id: 'lion', name: 'Lion', icon: '🦁', path: '/avatars/lion.svg' },
    { id: 'rabbit', name: 'Rabbit', icon: '🐰', path: '/avatars/rabbit.svg' },
    { id: 'koala', name: 'Koala', icon: '🐨', path: '/avatars/koala.svg' },
    { id: 'frog', name: 'Frog', icon: '🐸', path: '/avatars/frog.svg' },
];

const Profile: React.FC = () => {
    const { user, updateUser } = useAuth();

    // Personal details state
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [gender, setGender] = useState('');
    const [profilePhoto, setProfilePhoto] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Avatar Selection Modes: 'PRESET' | 'UPLOAD' | 'URL' | 'NONE'
    const [avatarSource, setAvatarSource] = useState<'PRESET' | 'UPLOAD' | 'URL' | 'NONE'>('NONE');
    const [selectedPreset, setSelectedPreset] = useState<string>('');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
    const [customUrlInput, setCustomUrlInput] = useState<string>('');
    const [urlError, setUrlError] = useState<string | null>(null);
    const [isValidatingUrl, setIsValidatingUrl] = useState<boolean>(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Header image error handler
    const [imageLoadError, setImageLoadError] = useState<boolean>(false);

    const syncLatestUserProfile = async () => {
        try {
            const res = await api.get('/users/me');
            updateUser(res.data);
            setDateOfBirth(res.data.dateOfBirth || '');
            setGender(res.data.gender || '');
            const currentPhoto = res.data.profilePhoto || '';
            setProfilePhoto(currentPhoto);

            if (currentPhoto) {
                const matchedPreset = ANIMAL_AVATARS.find(a => a.path === currentPhoto);
                if (matchedPreset) {
                    setAvatarSource('PRESET');
                    setSelectedPreset(matchedPreset.path);
                } else if (currentPhoto.startsWith('http://') || currentPhoto.startsWith('https://')) {
                    setAvatarSource('URL');
                    setCustomUrlInput(currentPhoto);
                } else if (currentPhoto.includes('/avatar/')) {
                    setAvatarSource('UPLOAD');
                }
            }
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

    // Calculate effective active avatar to show in header and preview
    const getActiveDisplayAvatar = (): string | null => {
        if (avatarSource === 'UPLOAD' && uploadPreviewUrl) {
            return uploadPreviewUrl; // Local instant blob preview
        }
        if (avatarSource === 'PRESET' && selectedPreset) {
            return getAvatarUrl(selectedPreset);
        }
        if (avatarSource === 'URL' && profilePhoto && (profilePhoto.startsWith('http://') || profilePhoto.startsWith('https://'))) {
            return getAvatarUrl(profilePhoto);
        }
        return getAvatarUrl(profilePhoto);
    };

    const activeDisplayAvatar = getActiveDisplayAvatar();

    // 1. Handle Animal Avatar selection
    const handleSelectAnimal = (path: string) => {
        setAvatarSource('PRESET');
        setSelectedPreset(path);
        setProfilePhoto(path);
        setUploadedFile(null);
        setUploadPreviewUrl(null);
        setUploadError(null);
        setUrlError(null);
        setImageLoadError(false);
    };

    // 2. Handle File Upload selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUploadError(null);
        setUrlError(null);
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation: MIME type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type.toLowerCase())) {
            setUploadError('Invalid file format. Please upload a JPG, PNG, or WebP image.');
            return;
        }

        // Validation: Size <= 5MB
        if (file.size > 5 * 1024 * 1024) {
            setUploadError('File size is too large. Maximum allowed size is 5MB.');
            return;
        }

        const preview = URL.createObjectURL(file);
        setUploadedFile(file);
        setUploadPreviewUrl(preview);
        setAvatarSource('UPLOAD');
        setSelectedPreset('');
        setImageLoadError(false);
    };

    // 3. Handle External URL Verification & Application
    const handleApplyCustomUrl = () => {
        setUrlError(null);
        setUploadError(null);
        const trimmed = customUrlInput.trim();

        if (!trimmed) {
            setUrlError('Please enter an image URL.');
            return;
        }

        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
            setUrlError('URL must begin with http:// or https://');
            return;
        }

        setIsValidatingUrl(true);
        const img = new Image();
        img.src = trimmed;
        img.onload = () => {
            setIsValidatingUrl(false);
            setProfilePhoto(trimmed);
            setAvatarSource('URL');
            setSelectedPreset('');
            setUploadedFile(null);
            setUploadPreviewUrl(null);
            setImageLoadError(false);
        };
        img.onerror = () => {
            setIsValidatingUrl(false);
            setUrlError('Unable to load image from this URL. If the remote server blocks direct linking, please download the image and upload it directly.');
        };
    };

    // 4. Save Profile Form
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileMsg(null);
        setIsSavingProfile(true);

        try {
            let photoUrlToPersist = profilePhoto;

            // If an uploaded file is pending, upload it first to /api/users/me/avatar
            if (avatarSource === 'UPLOAD' && uploadedFile) {
                const formData = new FormData();
                formData.append('file', uploadedFile);
                const uploadRes = await api.post('/users/me/avatar', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                photoUrlToPersist = uploadRes.data.profilePhoto || '';
                updateUser(uploadRes.data);
                setUploadedFile(null);
                setUploadPreviewUrl(null);
            }

            // Update user details
            const res = await api.put('/users/me', {
                dateOfBirth: dateOfBirth || null,
                gender: gender || null,
                profilePhoto: photoUrlToPersist || null,
            });

            updateUser(res.data);
            setProfilePhoto(res.data.profilePhoto || '');
            setProfileMsg({ type: 'success', text: 'Personal details and avatar updated successfully.' });
        } catch (err: any) {
            console.error('Failed to update profile', err);
            setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
        } finally {
            setIsSavingProfile(false);
        }
    };

    // Emergency Contact Modal Handlers
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

    const handleSaveContact = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalError('');
        setModalLoading(true);

        try {
            if (editingContactId) {
                await api.put(`/emergency-contacts/${editingContactId}`, {
                    name: modalName,
                    relationship: modalRelationship,
                    phoneNumber: modalPhone,
                    isPrimary: modalIsPrimary,
                });
            } else {
                await api.post('/emergency-contacts', {
                    name: modalName,
                    relationship: modalRelationship,
                    phoneNumber: modalPhone,
                    isPrimary: modalIsPrimary,
                });
            }

            setShowContactModal(false);
            await fetchContacts();
            await syncLatestUserProfile();
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

    const hasDob = Boolean(dateOfBirth || user.dateOfBirth);
    const hasEmergencyContact = contacts.length > 0;
    const isComplete = hasDob && hasEmergencyContact;

    return (
        <div className="min-h-screen relative z-10 pb-16">
            <Navbar />

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
                {/* Profile Header Card */}
                <div className="p-6 sm:p-8 rounded-3xl glass-card border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="flex items-center space-x-4 sm:space-x-5 min-w-0">
                        {/* Dynamic Avatar with Safe Error Fallback */}
                        <div className="relative shrink-0">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-[var(--accent)]/15 border-2 border-[var(--accent)]/40 flex items-center justify-center text-xl sm:text-2xl font-black text-[var(--accent)] shadow-[0_0_20px_var(--glow-purple)]">
                                {activeDisplayAvatar && !imageLoadError ? (
                                    <img 
                                        src={activeDisplayAvatar} 
                                        alt={user.firstName} 
                                        onError={() => setImageLoadError(true)}
                                        className="w-full h-full object-cover" 
                                    />
                                ) : (
                                    <span>{user.firstName ? user.firstName[0].toUpperCase() : 'U'}</span>
                                )}
                            </div>
                            <span 
                                className={`absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-[var(--bg)] flex items-center justify-center ${isComplete ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'}`}
                                title={isComplete ? 'Profile complete' : 'Profile incomplete'}
                            />
                        </div>

                        <div className="min-w-0 flex-1">
                            <h1 className="text-xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight truncate">
                                {user.firstName} {user.lastName}
                            </h1>
                            <p className="text-[var(--text-muted)] text-xs sm:text-sm truncate">{user.email}</p>
                        </div>
                    </div>

                    {/* Completion Status Badge */}
                    <div className="flex flex-col sm:items-end pt-2 sm:pt-0 border-t border-white/10 sm:border-t-0 w-full sm:w-auto">
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
                        <p className="text-[11px] sm:text-xs text-[var(--text-muted)] mt-1.5 sm:text-right">
                            {isComplete 
                                ? 'All athlete identity & safety details verified.' 
                                : 'Add Date of Birth & at least 1 Emergency Contact.'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                    {/* Left Column: Personal & Athlete Details (7 Cols) */}
                    <div className="lg:col-span-7 space-y-6 sm:space-y-8 w-full">
                        {/* Section 1: Account Identity (Read-only) */}
                        <div className="p-5 sm:p-8 rounded-3xl glass-card border border-white/10 w-full">
                            <div className="flex items-center space-x-3 mb-5 sm:mb-6">
                                <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-[var(--accent)]">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base sm:text-lg font-bold text-[var(--text)]">Account Identity</h2>
                                    <p className="text-xs text-[var(--text-muted)]">Core account information registered with StrideMate.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                                <div className="p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                                    <span className="text-xs text-[var(--text-muted)] block">First Name</span>
                                    <span className="font-semibold text-[var(--text)] truncate block">{user.firstName}</span>
                                </div>
                                <div className="p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                                    <span className="text-xs text-[var(--text-muted)] block">Last Name</span>
                                    <span className="font-semibold text-[var(--text)] truncate block">{user.lastName}</span>
                                </div>
                                <div className="p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                                    <span className="text-xs text-[var(--text-muted)] block">Email Address</span>
                                    <div className="flex items-center space-x-1.5 overflow-hidden">
                                        <span className="font-medium text-[var(--text)] truncate">{user.email}</span>
                                        <span title="Verified">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                                    <span className="text-xs text-[var(--text-muted)] block">Phone Number</span>
                                    <span className="font-medium text-[var(--text)] truncate block">{user.phoneNumber || 'Not registered'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Personal & Athlete Details (Editable) */}
                        <div className="p-5 sm:p-8 rounded-3xl glass-card border border-white/10 w-full space-y-5">
                            <div className="flex items-center space-x-3">
                                <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-[var(--accent)]">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base sm:text-lg font-bold text-[var(--text)]">Personal Details</h2>
                                    <p className="text-xs text-[var(--text-muted)]">Configure your age, gender, and avatar illustration.</p>
                                </div>
                            </div>

                            {profileMsg && (
                                <div className={`p-3.5 sm:p-4 rounded-xl text-xs sm:text-sm font-medium flex items-center space-x-2 ${profileMsg.type === 'success' ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400' : 'bg-[var(--danger)]/15 border border-[var(--danger)]/30 text-[var(--danger)]'}`}>
                                    {profileMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                                    <span>{profileMsg.text}</span>
                                </div>
                            )}

                            <form onSubmit={handleSaveProfile} className="space-y-5">
                                {/* Date of Birth */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="block text-xs sm:text-sm font-semibold text-[var(--text)]">
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
                                        className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/15 text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all [color-scheme:dark]"
                                    />
                                </div>

                                {/* Gender */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs sm:text-sm font-semibold text-[var(--text)]">Gender (Optional)</label>
                                    <select
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                        className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/15 text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all [color-scheme:dark]"
                                    >
                                        <option value="" className="bg-[var(--bg)] text-white/60">Not specified</option>
                                        {GENDERS.map((g) => (
                                            <option key={g} value={g} className="bg-[var(--bg)] text-white">{g}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Avatar & Profile Photo Section */}
                                <div className="space-y-4 pt-2 border-t border-white/10">
                                    <div>
                                        <label className="block text-xs sm:text-sm font-semibold text-[var(--text)]">CHOOSE YOUR AVATAR</label>
                                        <p className="text-[11px] text-[var(--text-muted)]">Select your athletic persona, upload a personal photo from your device, or link an image.</p>
                                    </div>

                                    {/* 1. Animal Avatars Grid */}
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                                            {ANIMAL_AVATARS.map((animal) => {
                                                const isSelected = avatarSource === 'PRESET' && selectedPreset === animal.path;
                                                return (
                                                    <button
                                                        type="button"
                                                        key={animal.id}
                                                        onClick={() => handleSelectAnimal(animal.path)}
                                                        className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all p-1 group flex flex-col items-center justify-center ${
                                                            isSelected
                                                                ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/50 scale-105 bg-[var(--accent)]/20 shadow-[0_0_15px_var(--glow-purple)]'
                                                                : 'border-white/10 hover:border-white/30 bg-white/5 opacity-70 hover:opacity-100 hover:scale-105'
                                                        }`}
                                                        title={animal.name}
                                                    >
                                                        <img src={animal.path} alt={animal.name} className="w-full h-full object-contain pointer-events-none" />
                                                        {isSelected && (
                                                            <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shadow-md">
                                                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="flex items-center my-3 text-xs text-white/30">
                                        <div className="flex-grow border-t border-white/10"></div>
                                        <span className="px-3 uppercase font-bold text-[10px] tracking-wider text-[var(--text-muted)]">OR</span>
                                        <div className="flex-grow border-t border-white/10"></div>
                                    </div>

                                    {/* 2. Upload Photo Option */}
                                    <div className="space-y-2">
                                        <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Device Image Upload</span>
                                        
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            accept="image/jpeg,image/png,image/webp,image/*"
                                            className="hidden"
                                        />

                                        {avatarSource === 'UPLOAD' && (uploadPreviewUrl || (profilePhoto && profilePhoto.includes('/avatar/'))) ? (
                                            <div className="p-3.5 rounded-2xl bg-white/5 border border-[var(--accent)]/50 ring-2 ring-[var(--accent)]/30 flex items-center justify-between gap-3 shadow-[0_0_15px_var(--glow-purple)]">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0">
                                                        <img 
                                                            src={uploadPreviewUrl || getAvatarUrl(profilePhoto)!} 
                                                            alt="Selected Upload" 
                                                            className="w-full h-full object-cover" 
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-[var(--text)]">Device Photo</p>
                                                        <p className="text-[10px] text-emerald-400 font-medium">{uploadedFile ? 'Ready to save' : 'Currently active'}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-[var(--text)] transition-all flex items-center gap-1"
                                                    >
                                                        <RefreshCw className="w-3.5 h-3.5" />
                                                        <span>Change</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-full h-12 rounded-2xl border border-dashed border-white/20 hover:border-[var(--accent)] bg-white/5 hover:bg-white/10 text-xs font-semibold text-[var(--text)] transition-all flex items-center justify-center space-x-2 group"
                                            >
                                                <Upload className="w-4 h-4 text-[var(--accent)] group-hover:scale-110 transition-transform" />
                                                <span>Upload Photo from Device (JPG, PNG, WebP)</span>
                                            </button>
                                        )}

                                        {uploadError && (
                                            <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                                <span>{uploadError}</span>
                                            </p>
                                        )}
                                    </div>

                                    {/* Divider */}
                                    <div className="flex items-center my-3 text-xs text-white/30">
                                        <div className="flex-grow border-t border-white/10"></div>
                                        <span className="px-3 uppercase font-bold text-[10px] tracking-wider text-[var(--text-muted)]">OR</span>
                                        <div className="flex-grow border-t border-white/10"></div>
                                    </div>

                                    {/* 3. Custom Image URL Option */}
                                    <div className="space-y-2">
                                        <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Custom Image URL</span>
                                        <div className="flex gap-2">
                                            <input
                                                type="url"
                                                placeholder="https://example.com/my-photo.jpg"
                                                value={customUrlInput}
                                                onChange={(e) => {
                                                    setCustomUrlInput(e.target.value);
                                                    setUrlError(null);
                                                }}
                                                className="flex-1 h-11 px-4 text-xs rounded-xl bg-white/5 border border-white/15 text-[var(--text)] placeholder-white/30 focus:outline-none focus:border-[var(--accent)] transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleApplyCustomUrl}
                                                disabled={isValidatingUrl || !customUrlInput.trim()}
                                                className="px-4 h-11 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-[var(--text)] transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                                            >
                                                {isValidatingUrl ? (
                                                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <ImageIcon className="w-3.5 h-3.5" />
                                                )}
                                                <span>Preview</span>
                                            </button>
                                        </div>

                                        {urlError && (
                                            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                                <span>{urlError}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSavingProfile}
                                    className="auth-submit-btn h-12 w-full sm:w-auto px-6 rounded-xl flex items-center justify-center space-x-2 font-semibold text-sm transition-all disabled:opacity-50 mt-4"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{isSavingProfile ? 'Saving Details...' : 'Save Personal Details'}</span>
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right Column: Emergency Contacts (5 Cols) */}
                    <div className="lg:col-span-5 space-y-6 w-full">
                        <div className="p-5 sm:p-8 rounded-3xl glass-card border border-white/10 h-full flex flex-col justify-between w-full">
                            <div>
                                <div className="flex items-center justify-between mb-5 sm:mb-6">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-[var(--accent)]">
                                            <Heart className="w-5 h-5 text-[var(--danger)]" />
                                        </div>
                                        <div>
                                            <h2 className="text-base sm:text-lg font-bold text-[var(--text)]">Emergency Contacts</h2>
                                            <p className="text-xs text-[var(--text-muted)]">Required for athlete safety telemetry.</p>
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
                                    <div className="p-5 rounded-2xl bg-white/5 border border-dashed border-white/15 text-center space-y-3 my-4">
                                        <ShieldAlert className="w-8 h-8 text-amber-400 mx-auto opacity-80" />
                                        <div>
                                            <p className="text-xs font-semibold text-[var(--text)]">No emergency contacts registered</p>
                                            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                                                Add at least 1 contact to complete your profile and unlock full activity tracking.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleOpenAddModal}
                                            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[var(--accent)]/20 text-[var(--accent)] text-xs font-semibold hover:bg-[var(--accent)]/30 transition-all"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>Add Contact Now</span>
                                        </button>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {contacts.map((c) => (
                                        <div 
                                            key={c.id} 
                                            className={`p-4 rounded-2xl border transition-all ${c.isPrimary ? 'bg-[var(--accent)]/10 border-[var(--accent)]/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-bold text-sm text-[var(--text)]">{c.name}</span>
                                                        {c.isPrimary && (
                                                            <span className="px-2 py-0.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] text-[10px] font-bold border border-[var(--accent)]/30">
                                                                PRIMARY
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-[var(--text-muted)]">{c.relationship}</p>
                                                    <p className="text-xs font-mono text-[var(--text)]">{c.phoneNumber}</p>
                                                </div>

                                                <div className="flex items-center space-x-1">
                                                    <button
                                                        onClick={() => handleOpenEditModal(c)}
                                                        className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
                                                        title="Edit Contact"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteContact(c.id)}
                                                        className="p-1.5 rounded-lg text-rose-400/60 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                                                        title="Delete Contact"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add / Edit Contact Modal */}
                {showContactModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="relative w-full max-w-md glass-card p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                <h3 className="text-lg font-bold text-[var(--text)]">
                                    {editingContactId ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
                                </h3>
                                <button
                                    onClick={() => setShowContactModal(false)}
                                    className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {modalError && (
                                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center space-x-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{modalError}</span>
                                </div>
                            )}

                            <form onSubmit={handleSaveContact} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-[var(--text)]">Contact Name</label>
                                    <input
                                        type="text"
                                        value={modalName}
                                        onChange={(e) => setModalName(e.target.value)}
                                        required
                                        placeholder="e.g. Jane Doe"
                                        className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/15 text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-all text-sm"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-[var(--text)]">Relationship</label>
                                    <select
                                        value={modalRelationship}
                                        onChange={(e) => setModalRelationship(e.target.value)}
                                        className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/15 text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-all text-sm [color-scheme:dark]"
                                    >
                                        {RELATIONSHIPS.map((r) => (
                                            <option key={r} value={r} className="bg-[var(--bg)] text-white">{r}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-[var(--text)]">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={modalPhone}
                                        onChange={(e) => setModalPhone(e.target.value)}
                                        required
                                        placeholder="e.g. +1 555-0199"
                                        className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/15 text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-all text-sm font-mono"
                                    />
                                </div>

                                <div className="flex items-center space-x-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="modalIsPrimary"
                                        checked={modalIsPrimary}
                                        onChange={(e) => setModalIsPrimary(e.target.checked)}
                                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-[var(--accent)] focus:ring-[var(--accent)]"
                                    />
                                    <label htmlFor="modalIsPrimary" className="text-xs text-[var(--text)] font-medium cursor-pointer">
                                        Designate as primary emergency contact
                                    </label>
                                </div>

                                <div className="flex space-x-3 pt-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowContactModal(false)}
                                        className="flex-1 h-11 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-[var(--text)] transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={modalLoading}
                                        className="flex-1 auth-submit-btn h-11 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                                    >
                                        {modalLoading ? 'Saving...' : 'Save Contact'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Profile;
