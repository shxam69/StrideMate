import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import StrideLoader from '../components/ui/StrideLoader';
import api from '../services/api';
import type { EmergencyContact, EmergencyEvent, SosResponse } from '../types';
import { 
    ShieldAlert, 
    Heart, 
    PhoneCall, 
    MessageSquare, 
    Send, 
    AlertTriangle, 
    CheckCircle2, 
    MapPin, 
    ExternalLink, 
    Plus, 
    Edit3, 
    Trash2, 
    X, 
    Radio, 
    History,
    Navigation,
    Clock
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

const Safety: React.FC = () => {
    // SOS State
    const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
    const [isTriggeringSos, setIsTriggeringSos] = useState<boolean>(false);
    const [gpsFeedback, setGpsFeedback] = useState<string | null>(null);
    const [sosResult, setSosResult] = useState<SosResponse | null>(null);
    const [sosError, setSosError] = useState<string | null>(null);

    // Hold-to-Confirm State
    const [holdProgress, setHoldProgress] = useState<number>(0);
    const holdTimerRef = useRef<number | null>(null);
    const holdStartTimeRef = useRef<number>(0);

    // Emergency Contacts State
    const [contacts, setContacts] = useState<EmergencyContact[]>([]);
    const [loadingContacts, setLoadingContacts] = useState<boolean>(true);

    // Add/Edit Contact Modal State
    const [showContactModal, setShowContactModal] = useState(false);
    const [editingContactId, setEditingContactId] = useState<string | null>(null);
    const [modalName, setModalName] = useState('');
    const [modalRelationship, setModalRelationship] = useState('Spouse');
    const [modalPhone, setModalPhone] = useState('');
    const [modalIsPrimary, setModalIsPrimary] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState('');

    // Safety Events History State
    const [events, setEvents] = useState<EmergencyEvent[]>([]);
    const [loadingEvents, setLoadingEvents] = useState<boolean>(true);
    const [resolvingId, setResolvingId] = useState<string | null>(null);

    // Provider Mode State
    const [providerInfo, setProviderInfo] = useState<{ mode: string; isReal: boolean; provider: string }>({
        mode: 'mock',
        isReal: false,
        provider: 'SPRINGEDGE'
    });

    useEffect(() => {
        fetchContacts();
        fetchEvents();
        fetchProviderMode();
    }, []);

    const fetchProviderMode = async () => {
        try {
            const res = await api.get('/safety/mode');
            setProviderInfo(res.data);
        } catch (err) {
            console.error('Failed to fetch safety provider mode', err);
        }
    };

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

    const fetchEvents = async () => {
        try {
            const res = await api.get('/safety/events');
            setEvents(res.data);
        } catch (err) {
            console.error('Failed to fetch emergency events', err);
        } finally {
            setLoadingEvents(false);
        }
    };

    // Hold-to-Confirm Mechanics
    const startHold = () => {
        if (contacts.length === 0) {
            setSosError('You must configure at least one emergency contact before triggering SOS.');
            return;
        }
        setSosError(null);
        setHoldProgress(0);
        holdStartTimeRef.current = Date.now();

        const interval = window.setInterval(() => {
            const elapsed = Date.now() - holdStartTimeRef.current;
            const progress = Math.min(100, Math.round((elapsed / 1500) * 100));
            setHoldProgress(progress);

            if (progress >= 100) {
                window.clearInterval(interval);
                holdTimerRef.current = null;
                setHoldProgress(0);
                executeSosDispatch();
            }
        }, 30);

        holdTimerRef.current = interval;
    };

    const cancelHold = () => {
        if (holdTimerRef.current !== null) {
            window.clearInterval(holdTimerRef.current);
            holdTimerRef.current = null;
        }
        setHoldProgress(0);
    };

    const handleClickSos = () => {
        if (contacts.length === 0) {
            setSosError('You must configure at least one emergency contact before triggering SOS.');
            return;
        }
        setShowConfirmModal(true);
    };

    const executeSosDispatch = () => {
        setShowConfirmModal(false);
        setIsTriggeringSos(true);
        setGpsFeedback('Acquiring high-accuracy GPS coordinates...');
        setSosError(null);

        if (!('geolocation' in navigator)) {
            setIsTriggeringSos(false);
            setSosError('Geolocation is not supported by your browser.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                const acc = Math.round(pos.coords.accuracy);

                setGpsFeedback(`Location locked: ${lat.toFixed(4)}, ${lng.toFixed(4)} (±${acc}m). Sending emergency alerts...`);

                try {
                    const res = await api.post('/safety/sos', {
                        latitude: lat,
                        longitude: lng,
                        accuracyMeters: acc,
                        clientRequestId: `sos-${Date.now()}`
                    });

                    setSosResult(res.data);
                    await fetchEvents();
                } catch (err: any) {
                    console.error('SOS dispatch error', err);
                    setSosError(err.response?.data?.message || 'Failed to dispatch SOS alert. Please try again.');
                } finally {
                    setIsTriggeringSos(false);
                }
            },
            (geoErr) => {
                setIsTriggeringSos(false);
                setSosError(`GPS acquisition failed (${geoErr.message}). Please ensure location permissions are granted.`);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleResolveEvent = async (id: string) => {
        setResolvingId(id);
        try {
            await api.post(`/safety/events/${id}/resolve`);
            await fetchEvents();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to resolve emergency event.');
        } finally {
            setResolvingId(null);
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
        } catch (err: any) {
            console.error('Save contact error', err);
            setModalError(err.response?.data?.message || 'Failed to save emergency contact. Verify the phone number.');
        } finally {
            setModalLoading(false);
        }
    };

    const handleDeleteContact = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this emergency contact?')) return;
        try {
            await api.delete(`/emergency-contacts/${id}`);
            await fetchContacts();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete emergency contact.');
        }
    };

    // Helper for truthful status badges
    const renderStatusBadge = (status?: string) => {
        switch (status) {
            case 'DELIVERED':
                return (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                        Delivered
                    </span>
                );
            case 'SENT':
                return (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                        Sent
                    </span>
                );
            case 'ACCEPTED':
            case 'REQUESTED':
                return (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
                        Accepted
                    </span>
                );
            case 'INITIATED':
                return (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 border border-blue-500/40 text-blue-300">
                        Call Initiated
                    </span>
                );
            case 'RINGING':
                return (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 border border-blue-500/40 text-blue-300">
                        Ringing
                    </span>
                );
            case 'COMPLETED':
                return (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                        Completed
                    </span>
                );
            case 'MOCK_SENT':
                return (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300">
                        Simulated Delivery
                    </span>
                );
            case 'UNAVAILABLE':
                return (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-500/20 border border-gray-500/40 text-gray-300">
                        Provider Offline
                    </span>
                );
            case 'SKIPPED':
                return (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 border border-slate-500/40 text-slate-300">
                        Skipped
                    </span>
                );
            case 'FAILED':
                return (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 border border-rose-500/40 text-rose-300">
                        Delivery Failed
                    </span>
                );
            default:
                return (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white/50">
                        {status || 'Pending'}
                    </span>
                );
        }
    };

    return (
        <div className="min-h-screen relative z-10 pb-16">
            <Navbar />

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
                {/* Header Banner */}
                <div className="p-6 sm:p-8 rounded-3xl glass-card border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="flex items-center space-x-4 sm:space-x-5 min-w-0">
                        <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
                            <ShieldAlert className="w-7 h-7 sm:w-8 sm:h-8" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                                <h1 className="text-xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight">
                                    Safety & SOS System
                                </h1>
                                {providerInfo.isReal ? (
                                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                        LIVE DELIVERY ({providerInfo.provider})
                                    </span>
                                ) : (
                                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                        SIMULATED DELIVERY (DEV MOCK)
                                    </span>
                                )}
                            </div>
                            <p className="text-[var(--text-muted)] text-xs sm:text-sm mt-0.5">
                                Instantly broadcast your real-time GPS location via SMS, WhatsApp, and Voice Call to your designated safety network.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Section 1: Prominent SOS Activation Center */}
                <div className="p-6 sm:p-8 rounded-3xl glass-card border border-rose-500/30 relative overflow-hidden bg-gradient-to-b from-rose-500/10 to-transparent">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                        <div className="space-y-2 text-center lg:text-left">
                            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/40">
                                <Radio className="w-3.5 h-3.5 animate-pulse" />
                                <span>EMERGENCY DISPATCH TRIGGER</span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black text-[var(--text)] tracking-tight">
                                Need Immediate Assistance?
                            </h2>
                            <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-xl">
                                Hold the SOS button for 1.5 seconds (or tap and confirm) to lock your GPS coordinates and trigger priority SMS, WhatsApp, and Voice emergency alerts.
                            </p>
                        </div>

                        {/* Hold-to-Confirm Interactive Button */}
                        <div className="flex flex-col items-center gap-3 shrink-0 relative">
                            {/* Radial Progress Glow Indicator */}
                            {holdProgress > 0 && (
                                <div className="absolute inset-[-8px] rounded-full border-4 border-rose-400 animate-pulse pointer-events-none" style={{ opacity: holdProgress / 100 }} />
                            )}

                            <button
                                onMouseDown={startHold}
                                onMouseUp={cancelHold}
                                onMouseLeave={cancelHold}
                                onTouchStart={startHold}
                                onTouchEnd={cancelHold}
                                onClick={handleClickSos}
                                disabled={isTriggeringSos}
                                className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-black text-xl sm:text-2xl tracking-wider shadow-[0_0_40px_rgba(244,63,94,0.6)] hover:shadow-[0_0_60px_rgba(244,63,94,0.9)] hover:scale-105 active:scale-95 transition-all flex flex-col items-center justify-center space-y-1 border-4 border-white/20 disabled:opacity-50 group cursor-pointer select-none overflow-hidden"
                            >
                                {/* Progress Fill Overlay */}
                                {holdProgress > 0 && (
                                    <div 
                                        className="absolute inset-0 bg-red-700/80 transition-all duration-75 origin-bottom"
                                        style={{ transform: `scaleY(${holdProgress / 100})` }}
                                    />
                                )}

                                <div className="relative z-10 flex flex-col items-center justify-center space-y-1">
                                    <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10 group-hover:scale-110 transition-transform" />
                                    <span>{isTriggeringSos ? 'SENDING...' : 'SOS'}</span>
                                    <span className="text-[10px] font-semibold text-white/80 uppercase">
                                        {holdProgress > 0 ? `HOLDING (${holdProgress}%)` : 'HOLD 1.5s'}
                                    </span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Step-by-Step GPS Feedback Indicator */}
                    {isTriggeringSos && (
                        <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center space-x-3 text-xs font-bold text-[var(--text)]">
                            <Navigation className="w-4 h-4 text-cyan-400 animate-spin" />
                            <span>{gpsFeedback}</span>
                        </div>
                    )}

                    {/* SOS Error Banner */}
                    {sosError && (
                        <div className="mt-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center space-x-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>{sosError}</span>
                        </div>
                    )}

                    {/* Live SOS Result Banner */}
                    {sosResult && (
                        <div className="mt-6 p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 space-y-4 animate-in fade-in zoom-in-95">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm sm:text-base">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span>
                                        {sosResult.status === 'DELIVERED' 
                                            ? 'Emergency Alert Delivered' 
                                            : sosResult.status === 'FAILED'
                                            ? 'Emergency Alert Delivery Failed'
                                            : 'Emergency Alert Requested & Dispatched'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setSosResult(null)}
                                    className="text-xs text-emerald-400/80 hover:text-emerald-400 font-semibold"
                                >
                                    Dismiss
                                </button>
                            </div>

                            <p className="text-xs text-[var(--text-muted)]">
                                Priority notification was dispatched for your designated primary contact ({sosResult.contactName || 'Primary Contact'} - {sosResult.contactPhone || 'Registered Phone'}):
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                                    <div className="flex items-center space-x-2 text-[var(--text)]">
                                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                                        <span>SMS Alert</span>
                                    </div>
                                    {renderStatusBadge(sosResult.sms)}
                                </div>

                                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                                    <div className="flex items-center space-x-2 text-[var(--text)]">
                                        <Send className="w-4 h-4 text-green-400" />
                                        <span>WhatsApp</span>
                                    </div>
                                    {renderStatusBadge(sosResult.whatsapp)}
                                </div>

                                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                                    <div className="flex items-center space-x-2 text-[var(--text)]">
                                        <PhoneCall className="w-4 h-4 text-rose-400" />
                                        <span>Voice Call</span>
                                    </div>
                                    {renderStatusBadge(sosResult.call)}
                                </div>
                            </div>

                            {sosResult.locationUrl && (
                                <div className="pt-2 flex items-center justify-between text-xs border-t border-emerald-500/20">
                                    <div className="flex items-center space-x-1.5 text-emerald-300 font-mono">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span>Pinned GPS Coordinates</span>
                                    </div>
                                    <a
                                        href={sosResult.locationUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center space-x-1 text-emerald-400 hover:underline font-bold"
                                    >
                                        <span>Open Maps Link</span>
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Section 2: Designated Emergency Contacts Management */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold text-[var(--text)] tracking-tight">
                                Emergency Contacts Network
                            </h2>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                People who will receive instant telemetry alerts if you trigger SOS during a session.
                            </p>
                        </div>

                        <button
                            onClick={handleOpenAddModal}
                            className="auth-submit-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Contact</span>
                        </button>
                    </div>

                    {loadingContacts ? (
                        <div className="p-12 glass-card">
                            <StrideLoader size="md" text="Loading designated emergency contacts..." />
                        </div>
                    ) : contacts.length === 0 ? (
                        <div className="p-8 sm:p-12 rounded-3xl glass-card border border-white/10 text-center space-y-3">
                            <Heart className="w-10 h-10 mx-auto text-[var(--text-muted)] opacity-50" />
                            <h3 className="text-base font-bold text-[var(--text)]">No Emergency Contacts Registered</h3>
                            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                                Add at least one family member, friend, or trainer to ensure your safety tracking alerts reach someone immediately.
                            </p>
                            <button
                                onClick={handleOpenAddModal}
                                className="auth-submit-btn px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center space-x-2 shadow-md"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add First Emergency Contact</span>
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {contacts.map((c) => (
                                <div
                                    key={c.id}
                                    className="p-5 rounded-3xl glass-card border border-white/10 flex items-center justify-between gap-4 hover:border-[var(--accent)]/40 transition-all group"
                                >
                                    <div className="flex items-center space-x-3.5 min-w-0">
                                        <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--accent)] shrink-0 font-black text-sm">
                                            {c.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center space-x-2">
                                                <h3 className="text-sm font-bold text-[var(--text)] truncate">{c.name}</h3>
                                                {c.isPrimary && (
                                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30 shrink-0">
                                                        PRIMARY
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-[var(--text-muted)]">{c.relationship} • {c.phoneNumber}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-1">
                                        <button
                                            onClick={() => handleOpenEditModal(c)}
                                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-colors"
                                            title="Edit Contact"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteContact(c.id)}
                                            className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-[var(--text-muted)] hover:text-rose-400 transition-colors"
                                            title="Delete Contact"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Section 3: Safety Incidents & SOS History Log */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <History className="w-5 h-5 text-[var(--accent)]" />
                        <h2 className="text-lg sm:text-xl font-bold text-[var(--text)] tracking-tight">
                            Emergency Incident Logs
                        </h2>
                    </div>

                    {loadingEvents ? (
                        <div className="p-12 glass-card">
                            <StrideLoader size="md" text="Loading incident logs..." />
                        </div>
                    ) : events.length === 0 ? (
                        <div className="p-6 rounded-3xl glass-card border border-white/10 text-center text-xs text-[var(--text-muted)]">
                            No emergency incidents have been recorded. Stay safe on your strides!
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {events.map((ev) => (
                                <div
                                    key={ev.id}
                                    className="p-4 sm:p-5 rounded-3xl glass-card border border-white/10 space-y-3"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex items-center space-x-2.5">
                                            <div className={`p-2 rounded-xl ${ev.status === 'RESOLVED' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                                                <ShieldAlert className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-xs font-bold text-[var(--text)]">
                                                        SOS Incident #{ev.id.substring(0, 8)}
                                                    </span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ev.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                                                        {ev.status}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(ev.triggeredAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>

                                        {ev.status !== 'RESOLVED' && (
                                            <button
                                                onClick={() => handleResolveEvent(ev.id)}
                                                disabled={resolvingId === ev.id}
                                                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold transition-all self-start sm:self-center"
                                            >
                                                {resolvingId === ev.id ? 'Resolving...' : 'Mark as Resolved'}
                                            </button>
                                        )}
                                    </div>

                                    {/* Multichannel Delivery Breakdown */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-white/5 text-xs">
                                        <div className="flex items-center justify-between p-2 rounded-xl bg-white/5">
                                            <span className="text-[var(--text-muted)]">SMS</span>
                                            {renderStatusBadge(ev.smsStatus)}
                                        </div>
                                        <div className="flex items-center justify-between p-2 rounded-xl bg-white/5">
                                            <span className="text-[var(--text-muted)]">WhatsApp</span>
                                            {renderStatusBadge(ev.whatsappStatus)}
                                        </div>
                                        <div className="flex items-center justify-between p-2 rounded-xl bg-white/5">
                                            <span className="text-[var(--text-muted)]">Voice Call</span>
                                            {renderStatusBadge(ev.callStatus)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Modal: SOS Hold / Tap Confirmation */}
                {showConfirmModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="relative w-full max-w-md glass-card p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200 border border-rose-500/40">
                            <div className="flex items-center space-x-3 text-rose-400">
                                <div className="p-3 rounded-2xl bg-rose-500/20">
                                    <ShieldAlert className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-black text-[var(--text)]">Confirm Emergency SOS</h3>
                            </div>

                            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                                This action will immediately capture your current coordinates and dispatch multichannel priority emergency notifications to your registered contacts. Are you in an emergency?
                            </p>

                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-[var(--text)] text-xs font-bold transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={executeSosDispatch}
                                    className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-[0_0_20px_rgba(244,63,94,0.5)]"
                                >
                                    Yes, Trigger SOS
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal: Add/Edit Emergency Contact */}
                {showContactModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="relative w-full max-w-md glass-card p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-200">
                            <button
                                onClick={() => setShowContactModal(false)}
                                className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <h3 className="text-lg font-bold text-[var(--text)]">
                                {editingContactId ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
                            </h3>

                            {modalError && (
                                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                                    {modalError}
                                </div>
                            )}

                            <form onSubmit={handleSaveContact} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">
                                        Contact Full Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={modalName}
                                        onChange={(e) => setModalName(e.target.value)}
                                        placeholder="e.g. Sarah Connor"
                                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[var(--text)] text-xs focus:outline-none focus:border-[var(--accent)]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">
                                        Relationship
                                    </label>
                                    <select
                                        value={modalRelationship}
                                        onChange={(e) => setModalRelationship(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-[#1e2230] border border-white/10 text-[var(--text)] text-xs focus:outline-none focus:border-[var(--accent)]"
                                    >
                                        {RELATIONSHIPS.map((r) => (
                                            <option key={r} value={r} className="bg-[#1e2230] text-white">
                                                {r}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">
                                        Phone Number (with Country Code)
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        value={modalPhone}
                                        onChange={(e) => setModalPhone(e.target.value)}
                                        placeholder="e.g. +14155552671"
                                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[var(--text)] text-xs focus:outline-none focus:border-[var(--accent)]"
                                    />
                                </div>

                                <div className="flex items-center space-x-2 pt-1">
                                    <input
                                        type="checkbox"
                                        id="modalPrimary"
                                        checked={modalIsPrimary}
                                        onChange={(e) => setModalIsPrimary(e.target.checked)}
                                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-[var(--accent)] focus:ring-0"
                                    />
                                    <label htmlFor="modalPrimary" className="text-xs text-[var(--text)] cursor-pointer">
                                        Set as Primary Emergency Contact
                                    </label>
                                </div>

                                <div className="flex items-center gap-3 pt-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowContactModal(false)}
                                        className="flex-1 py-2.5 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/15 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={modalLoading}
                                        className="flex-1 py-2.5 rounded-xl auth-submit-btn text-xs font-bold shadow-lg disabled:opacity-50"
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

export default Safety;
