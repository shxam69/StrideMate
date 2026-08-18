import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
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
    Check
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
    const [sosResult, setSosResult] = useState<SosResponse | null>(null);
    const [sosError, setSosError] = useState<string | null>(null);

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

    useEffect(() => {
        fetchContacts();
        fetchEvents();
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

    const fetchEvents = async () => {
        try {
            const res = await api.get('/safety/events');
            setEvents(res.data);
        } catch (err) {
            console.error('Failed to fetch safety events', err);
        } finally {
            setLoadingEvents(false);
        }
    };

    const handleTriggerSos = () => {
        setSosError(null);
        setSosResult(null);

        if (contacts.length === 0) {
            setSosError('You must configure at least one emergency contact before sending an SOS.');
            return;
        }

        setShowConfirmModal(true);
    };

    const executeSosDispatch = () => {
        setShowConfirmModal(false);
        setIsTriggeringSos(true);
        setSosError(null);

        if (!('geolocation' in navigator)) {
            setIsTriggeringSos(false);
            setSosError('Geolocation is not supported by your browser.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const res = await api.post('/safety/sos', {
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        accuracyMeters: pos.coords.accuracy,
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
            () => {
                setIsTriggeringSos(false);
                setSosError('Unable to acquire GPS location. Please allow location permissions to send SOS.');
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
            setModalError(err.response?.data?.message || 'Failed to save contact.');
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
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                                    Emergency Telemetry
                                </span>
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
                                Activating SOS will immediately capture your precise coordinates and dispatch priority alerts to your primary emergency contact via SMS, WhatsApp, and an automated voice call.
                            </p>
                        </div>

                        <div className="flex flex-col items-center gap-3 shrink-0">
                            <button
                                onClick={handleTriggerSos}
                                disabled={isTriggeringSos}
                                className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-black text-xl sm:text-2xl tracking-wider shadow-[0_0_40px_rgba(244,63,94,0.6)] hover:shadow-[0_0_60px_rgba(244,63,94,0.9)] hover:scale-105 active:scale-95 transition-all flex flex-col items-center justify-center space-y-1 border-4 border-white/20 disabled:opacity-50 group cursor-pointer"
                            >
                                <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10 group-hover:scale-110 transition-transform" />
                                <span>{isTriggeringSos ? 'SENDING...' : 'SOS'}</span>
                                <span className="text-[10px] font-semibold text-white/80 uppercase">Hold / Tap</span>
                            </button>
                        </div>
                    </div>

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
                                    <span>🚨 SOS ALERT DISPATCHED SUCCESSFULLY</span>
                                </div>
                                <span className="text-xs text-white/60">
                                    Event #{sosResult.eventId.substring(0, 8)}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                                    <div className="flex items-center space-x-2 text-xs">
                                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                                        <span>SMS Alert</span>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-400 uppercase">{sosResult.sms}</span>
                                </div>

                                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                                    <div className="flex items-center space-x-2 text-xs">
                                        <Send className="w-4 h-4 text-emerald-400" />
                                        <span>WhatsApp Alert</span>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-400 uppercase">{sosResult.whatsapp}</span>
                                </div>

                                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                                    <div className="flex items-center space-x-2 text-xs">
                                        <PhoneCall className="w-4 h-4 text-emerald-400" />
                                        <span>Emergency Voice Call</span>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-400 uppercase">{sosResult.call}</span>
                                </div>
                            </div>

                            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs border-t border-white/10">
                                <div className="flex items-center space-x-2 text-[var(--text-muted)]">
                                    <MapPin className="w-4 h-4 text-rose-400" />
                                    <span>Location shared:</span>
                                    <a
                                        href={sosResult.locationUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[var(--accent)] font-semibold hover:underline inline-flex items-center gap-1"
                                    >
                                        <span>View Map Pin</span>
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                                <span className="text-[var(--text-muted)]">
                                    Contact notified: {sosResult.contactName} ({sosResult.contactPhone})
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                    {/* Left Column: Emergency Contacts Network (7 Cols) */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="p-6 sm:p-8 rounded-3xl glass-card border border-white/10 space-y-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-rose-400">
                                        <Heart className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base sm:text-lg font-bold text-[var(--text)]">Emergency Contacts Network</h2>
                                        <p className="text-xs text-[var(--text-muted)]">Designated contacts who receive instant SOS dispatches.</p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleOpenAddModal}
                                    className="p-2 sm:p-2.5 rounded-xl bg-[var(--accent)]/20 border border-[var(--accent)]/40 hover:bg-[var(--accent)]/30 text-[var(--accent)] transition-all"
                                    title="Add Contact"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            {contacts.length === 0 && !loadingContacts && (
                                <div className="p-6 rounded-2xl bg-white/5 border border-dashed border-white/15 text-center space-y-3">
                                    <ShieldAlert className="w-8 h-8 text-amber-400 mx-auto" />
                                    <p className="text-xs text-[var(--text)] font-semibold">No emergency contacts registered yet.</p>
                                    <button
                                        onClick={handleOpenAddModal}
                                        className="px-4 py-2 rounded-xl bg-[var(--accent)]/20 text-[var(--accent)] text-xs font-bold"
                                    >
                                        Add Contact
                                    </button>
                                </div>
                            )}

                            <div className="space-y-3">
                                {contacts.map((c) => (
                                    <div
                                        key={c.id}
                                        className={`p-4 rounded-2xl border transition-all ${
                                            c.isPrimary
                                                ? 'bg-rose-500/10 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                                                : 'bg-white/5 border-white/10 hover:border-white/20'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-bold text-sm text-[var(--text)]">{c.name}</span>
                                                    {c.isPrimary && (
                                                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                                                            PRIMARY DISPATCH
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
                                                    title="Edit"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteContact(c.id)}
                                                    className="p-1.5 rounded-lg text-rose-400/60 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                                                    title="Delete"
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

                    {/* Right Column: Safety Events History (5 Cols) */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="p-6 sm:p-8 rounded-3xl glass-card border border-white/10 space-y-5">
                            <div className="flex items-center space-x-3">
                                <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-[var(--accent)]">
                                    <History className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base sm:text-lg font-bold text-[var(--text)]">Safety Events History</h2>
                                    <p className="text-xs text-[var(--text-muted)]">Past emergency activations and resolution log.</p>
                                </div>
                            </div>

                            {events.length === 0 && !loadingEvents && (
                                <div className="p-6 rounded-2xl bg-white/5 border border-dashed border-white/15 text-center text-xs text-[var(--text-muted)]">
                                    No safety events on record. All clear!
                                </div>
                            )}

                            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                                {events.map((ev) => (
                                    <div
                                        key={ev.id}
                                        className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5 text-xs"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                                ev.status === 'RESOLVED' 
                                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                                            }`}>
                                                {ev.status}
                                            </span>
                                            <span className="text-[var(--text-muted)]">
                                                {new Date(ev.triggeredAt).toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-[var(--text-muted)]">
                                            <span>Channels: SMS ({ev.smsStatus || 'N/A'}) • WA ({ev.whatsappStatus || 'N/A'}) • Call ({ev.callStatus || 'N/A'})</span>
                                        </div>

                                        {ev.latitude != null && ev.longitude != null && (
                                            <div className="flex items-center justify-between pt-1 border-t border-white/5">
                                                <a
                                                    href={`https://maps.google.com/?q=${ev.latitude},${ev.longitude}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[var(--accent)] hover:underline inline-flex items-center gap-1"
                                                >
                                                    <MapPin className="w-3 h-3" />
                                                    <span>View Coordinates Pin</span>
                                                </a>

                                                {ev.status !== 'RESOLVED' && (
                                                    <button
                                                        onClick={() => handleResolveEvent(ev.id)}
                                                        disabled={resolvingId === ev.id}
                                                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-semibold text-[10px] transition-all flex items-center gap-1"
                                                    >
                                                        <Check className="w-3 h-3" />
                                                        <span>{resolvingId === ev.id ? 'Resolving...' : 'Mark Resolved'}</span>
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2-Step SOS Confirmation Modal */}
                {showConfirmModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
                        <div className="relative w-full max-w-md glass-card p-6 sm:p-8 space-y-5 border border-rose-500/40 animate-in zoom-in-95 duration-200 text-center">
                            <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
                                <AlertTriangle className="w-8 h-8 animate-bounce" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-[var(--text)] tracking-tight">
                                    Trigger Emergency SOS?
                                </h3>
                                <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                                    Are you sure you need emergency assistance? This will dispatch your live coordinates via SMS, WhatsApp, and Voice Call to:
                                </p>
                                {contacts.find(c => c.isPrimary) && (
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 font-bold text-xs text-rose-300">
                                        {contacts.find(c => c.isPrimary)?.name} ({contacts.find(c => c.isPrimary)?.phoneNumber})
                                    </div>
                                )}
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="flex-1 h-12 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-[var(--text)] transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={executeSosDispatch}
                                    className="flex-1 h-12 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black tracking-wide shadow-[0_0_20px_rgba(244,63,94,0.6)] transition-all"
                                >
                                    Yes, Send SOS
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add / Edit Emergency Contact Modal */}
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
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
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
                                        Designate as primary emergency dispatch recipient
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

export default Safety;
