import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { useGeoTracker } from '../hooks/useGeoTracker';
import type { DetectedActivity } from '../types';
import { 
    Flame, 
    Footprints, 
    Bike, 
    Droplets, 
    Dumbbell, 
    Play, 
    Pause, 
    Square, 
    ShieldAlert, 
    CheckCircle2, 
    Sparkles, 
    Radio,
    Clock,
    Activity as ActivityIcon,
    AlertTriangle,
    Lock
} from 'lucide-react';

const formatSeconds = (sec: number): string => {
    const hours = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    
    if (hours > 0) {
        return `${hours < 10 ? '0' : ''}${hours}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const ACTIVITY_CONFIG: Record<DetectedActivity, { label: string; color: string; bg: string; border: string; glow: string; icon: React.ElementType }> = {
    WALKING: { label: 'Walking', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]', icon: Footprints },
    JOGGING: { label: 'Jogging', color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]', icon: Flame },
    RUNNING: { label: 'Running', color: 'text-rose-400', bg: 'bg-rose-500/15', border: 'border-rose-500/30', glow: 'shadow-[0_0_20px_rgba(244,63,94,0.3)]', icon: Flame },
    CYCLING: { label: 'Cycling', color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]', icon: Bike },
    IDLE: { label: 'Stationary / Idle', color: 'text-slate-400', bg: 'bg-slate-500/15', border: 'border-slate-500/30', glow: '', icon: ActivityIcon },
};

const AddActivity: React.FC = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState<'AUTO_TRACK' | 'MANUAL_TIMER'>('AUTO_TRACK');
    const [preferredSport, setPreferredSport] = useState<string>('AUTO');

    // Unified Geo tracker hook
    const tracker = useGeoTracker();

    // Manual timer state (for Gym / Swimming)
    const [manualSport, setManualSport] = useState<'GYM' | 'SWIMMING'>('GYM');
    const [manualTimerState, setManualTimerState] = useState<'idle' | 'running' | 'paused' | 'stopped'>('idle');
    const [manualSeconds, setManualSeconds] = useState<number>(0);
    const manualIntervalRef = useRef<any>(null);

    // Saving states
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [savedResponse, setSavedResponse] = useState<any | null>(null);

    // Manual Timer interval handler
    useEffect(() => {
        if (manualTimerState === 'running') {
            manualIntervalRef.current = setInterval(() => {
                setManualSeconds(prev => prev + 1);
            }, 1000);
        } else {
            if (manualIntervalRef.current) {
                clearInterval(manualIntervalRef.current);
                manualIntervalRef.current = null;
            }
        }
        return () => {
            if (manualIntervalRef.current) clearInterval(manualIntervalRef.current);
        };
    }, [manualTimerState]);

    // Handle Save Auto-Track Activity
    const handleSaveAutoTrack = async () => {
        setIsSaving(true);
        setSaveError(null);

        try {
            const payload = {
                sport: tracker.dominantSport,
                distanceKm: tracker.totalDistanceKm > 0 ? tracker.totalDistanceKm : undefined,
                totalDurationSeconds: Math.max(1, tracker.elapsedSeconds),
                walkingDurationSeconds: tracker.breakdown.walkingSeconds,
                joggingDurationSeconds: tracker.breakdown.joggingSeconds,
                runningDurationSeconds: tracker.breakdown.runningSeconds,
                cyclingDurationSeconds: tracker.breakdown.cyclingSeconds,
                startedAt: tracker.startedAt || new Date().toISOString(),
                endedAt: tracker.endedAt || new Date().toISOString(),
            };

            const res = await api.post('/activities', payload);
            setSavedResponse(res.data);

            setTimeout(() => {
                navigate('/dashboard');
            }, 1800);
        } catch (err: any) {
            console.error('Failed to save activity', err);
            setSaveError(err.response?.data?.message || 'Failed to save activity. Please try again.');
            setIsSaving(false);
        }
    };

    // Handle Save Manual Timer Activity
    const handleSaveManualTimer = async () => {
        setIsSaving(true);
        setSaveError(null);

        try {
            const durationMinutes = Math.floor(manualSeconds / 60);
            const durationSeconds = manualSeconds % 60;

            const payload = {
                sport: manualSport,
                durationMinutes: durationMinutes > 0 ? durationMinutes : 0,
                durationSeconds: durationSeconds,
                totalDurationSeconds: manualSeconds,
            };

            const res = await api.post('/activities', payload);
            setSavedResponse(res.data);

            setTimeout(() => {
                navigate('/dashboard');
            }, 1800);
        } catch (err: any) {
            console.error('Failed to save manual timer activity', err);
            setSaveError(err.response?.data?.message || 'Failed to save workout. Please try again.');
            setIsSaving(false);
        }
    };

    // Calculate percentage breakdown
    const activeMovingSeconds = tracker.breakdown.walkingSeconds + tracker.breakdown.joggingSeconds + tracker.breakdown.runningSeconds + tracker.breakdown.cyclingSeconds;
    const totalTimeForBreakdown = activeMovingSeconds > 0 ? activeMovingSeconds : Math.max(1, tracker.elapsedSeconds);

    const walkPercent = Math.round((tracker.breakdown.walkingSeconds / totalTimeForBreakdown) * 100);
    const jogPercent = Math.round((tracker.breakdown.joggingSeconds / totalTimeForBreakdown) * 100);
    const runPercent = Math.round((tracker.breakdown.runningSeconds / totalTimeForBreakdown) * 100);
    const cyclePercent = Math.round((tracker.breakdown.cyclingSeconds / totalTimeForBreakdown) * 100);

    const activeConfig = ACTIVITY_CONFIG[tracker.currentActivity];
    const ActiveIcon = activeConfig.icon;

    // Helper to render GPS Status badge according to exact specification
    const renderGpsStatusBadge = () => {
        if (tracker.isSimulating) {
            return (
                <span className="text-[11px] px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold tracking-wider">
                    🟡 SIMULATOR MODE
                </span>
            );
        }

        switch (tracker.gpsStatus) {
            case 'INSECURE_CONTEXT':
                return (
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold flex items-center space-x-1">
                        <Lock className="w-3 h-3" />
                        <span>HTTPS REQUIRED FOR GPS</span>
                    </span>
                );
            case 'DENIED':
                return (
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold flex items-center space-x-1">
                        <ShieldAlert className="w-3 h-3" />
                        <span>LOCATION PERMISSION DENIED</span>
                    </span>
                );
            case 'UNAVAILABLE':
                return (
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-500/20 border border-slate-500/40 text-slate-300 font-bold flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>GPS UNAVAILABLE</span>
                    </span>
                );
            case 'REQUESTING':
                return (
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold animate-pulse flex items-center space-x-1">
                        <Radio className="w-3 h-3 animate-spin" />
                        <span>REQUESTING GPS...</span>
                    </span>
                );
            case 'GRANTED':
                if (tracker.gpsAccuracy !== null && tracker.devTelemetry.samplesReceived > 0) {
                    return (
                        <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                            <Radio className="w-3.5 h-3.5 animate-pulse" />
                            <span>GPS LOCKED (±{tracker.gpsAccuracy}m)</span>
                        </div>
                    );
                }
                return (
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold flex items-center space-x-1">
                        <Radio className="w-3 h-3 animate-pulse" />
                        <span>ACQUIRING SATELLITE FIX...</span>
                    </span>
                );
            case 'PROMPT':
            default:
                return (
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-white/70 font-semibold">
                        GPS PERMISSION REQUIRED
                    </span>
                );
        }
    };

    return (
        <div className="min-h-screen relative z-10 pb-16">
            <Navbar />

            <main className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
                {/* Header & Mode Switcher */}
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight">
                                {mode === 'AUTO_TRACK' ? 'Live Activity Tracker' : 'Workout Timer'}
                            </h1>
                            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
                                {mode === 'AUTO_TRACK' 
                                    ? 'Dynamic GPS telemetry with real-time Walk / Jog / Run segmentation' 
                                    : 'Accurate timer for Gym and Pool sessions'}
                            </p>
                        </div>

                        {/* Top Mode Tabs (Only visible when not actively tracking) */}
                        {tracker.status === 'idle' && manualTimerState === 'idle' && (
                            <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl self-start">
                                <button
                                    onClick={() => setMode('AUTO_TRACK')}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                        mode === 'AUTO_TRACK'
                                            ? 'bg-[var(--accent)] text-white shadow-[0_0_12px_var(--glow-purple)]'
                                            : 'text-white/60 hover:text-white'
                                    }`}
                                >
                                    🛰️ Auto Track
                                </button>
                                <button
                                    onClick={() => setMode('MANUAL_TIMER')}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                        mode === 'MANUAL_TIMER'
                                            ? 'bg-[var(--accent)] text-white shadow-[0_0_12px_var(--glow-purple)]'
                                            : 'text-white/60 hover:text-white'
                                    }`}
                                >
                                    ⏱️ Gym / Swim
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ======================================================== */}
                {/* MODE 1: AUTO TRACK (GPS + DYNAMIC SEGMENTATION) */}
                {/* ======================================================== */}
                {mode === 'AUTO_TRACK' && (
                    <div className="space-y-4">
                        {/* 1. SETUP SCREEN (IDLE) */}
                        {tracker.status === 'idle' && (
                            <div className="glass-card p-6 sm:p-8 space-y-6">
                                <div>
                                    <h2 className="text-lg font-bold text-white mb-1">Outdoor Session Setup</h2>
                                    <p className="text-xs text-white/60">Choose your activity focus or let StrideMate auto-classify your movement.</p>
                                </div>

                                {/* Preferred Sport Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                    {[
                                        { id: 'AUTO', label: 'Auto Detect', icon: Sparkles, color: 'text-[var(--accent)]' },
                                        { id: 'WALKING', label: 'Walk Focus', icon: Footprints, color: 'text-emerald-400' },
                                        { id: 'RUNNING', label: 'Run / Jog', icon: Flame, color: 'text-rose-400' },
                                        { id: 'CYCLING', label: 'Cycling', icon: Bike, color: 'text-blue-400' },
                                    ].map((s) => {
                                        const isSelected = preferredSport === s.id;
                                        const Icon = s.icon;
                                        return (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => setPreferredSport(s.id)}
                                                className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                                                    isSelected
                                                        ? 'bg-white/10 border-[var(--accent)] shadow-[0_0_15px_rgba(99,102,241,0.25)] scale-[1.02]'
                                                        : 'bg-white/5 border-white/10 hover:bg-white/10 opacity-70 hover:opacity-100'
                                                }`}
                                            >
                                                <Icon className={`w-5 h-5 ${s.color}`} />
                                                <span className="text-xs font-semibold text-white">{s.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* GPS Status & Simulator Mode Card */}
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center space-x-2">
                                            <Radio className="w-4 h-4 text-[var(--accent)]" />
                                            <span className="font-semibold text-white/90">GPS Status:</span>
                                        </div>
                                        {renderGpsStatusBadge()}
                                    </div>

                                    {/* Insecure Context Note (if accessing over LAN HTTP) */}
                                    {!tracker.devTelemetry.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && (
                                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 space-y-1">
                                            <p className="font-bold flex items-center gap-1">
                                                <Lock className="w-3.5 h-3.5" /> Note on Mobile Chrome (LAN HTTP):
                                            </p>
                                            <p className="text-white/70">
                                                Chrome on Android disables Geolocation on plain IP addresses (<code className="text-amber-300">192.168.x.x</code>) because it is not an HTTPS origin.
                                            </p>
                                            <p className="text-white/70">
                                                👉 To test real GPS on phone: open <code className="text-amber-300">chrome://flags/#unsafely-treat-insecure-origin-as-secure</code> on phone, add <code className="text-amber-300">http://192.168.1.6:5173</code>, enable and relaunch Chrome; or use <b>Simulator Mode</b> below.
                                            </p>
                                        </div>
                                    )}

                                    {/* Simulator Mode Toggle */}
                                    <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-semibold text-white/90">Simulator / Demo Mode</p>
                                            <p className="text-[11px] text-white/50">Feeds synthetic GPS telemetry through the real processing pipeline</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => tracker.setIsSimulating(!tracker.isSimulating)}
                                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                                tracker.isSimulating
                                                    ? 'bg-amber-500/25 border border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                                                    : 'bg-white/5 border border-white/15 text-white/60 hover:text-white'
                                            }`}
                                        >
                                            {tracker.isSimulating ? '🟡 Simulator ON' : 'Off'}
                                        </button>
                                    </div>
                                </div>

                                {tracker.error && (
                                    <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2">
                                        <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="font-bold">{tracker.error}</p>
                                            {tracker.gpsStatus === 'DENIED' && (
                                                <p className="text-[11px] opacity-80">Enable location permission in Chrome site settings.</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Big Start Button (triggers permission directly from user click) */}
                                <button
                                    onClick={() => tracker.startTracking(preferredSport)}
                                    className="auth-submit-btn w-full h-16 rounded-2xl flex items-center justify-center space-x-3 text-lg font-bold shadow-2xl active:scale-[0.98] transition-transform"
                                >
                                    <Play className="w-6 h-6 fill-current" />
                                    <span>START TRACKING</span>
                                </button>
                            </div>
                        )}

                        {/* 2. LIVE ACTIVE TRACKING SCREEN */}
                        {(tracker.status === 'tracking' || tracker.status === 'paused') && (
                            <div className="glass-card p-5 sm:p-8 space-y-6">
                                {/* Top Status Header */}
                                <div className="flex items-center justify-between">
                                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold">
                                        <span className={`w-2 h-2 rounded-full ${tracker.status === 'tracking' ? 'bg-rose-400 animate-ping' : 'bg-amber-400'}`}></span>
                                        <span>{tracker.status === 'tracking' ? 'LIVE TRACKING' : 'SESSION PAUSED'}</span>
                                    </div>

                                    {renderGpsStatusBadge()}
                                </div>

                                {/* Detected Activity Showcase Badge */}
                                <div className={`p-4 sm:p-5 rounded-3xl border transition-all duration-300 flex items-center justify-between ${activeConfig.bg} ${activeConfig.border} ${activeConfig.glow}`}>
                                    <div className="flex items-center space-x-3.5">
                                        <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md">
                                            <ActiveIcon className={`w-7 h-7 sm:w-8 sm:h-8 ${activeConfig.color}`} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] uppercase tracking-wider font-bold text-white/50">Current Detected Movement</p>
                                            <p className={`text-xl sm:text-2xl font-black ${activeConfig.color}`}>{activeConfig.label}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl sm:text-3xl font-mono font-black text-white">{tracker.currentSpeedKmh}</span>
                                        <span className="text-xs text-white/60 ml-1">km/h</span>
                                    </div>
                                </div>

                                {/* Huge Monospace Timer */}
                                <div className="text-center py-2 sm:py-4">
                                    <p className="text-xs uppercase tracking-widest text-white/40 font-bold mb-1">Session Duration</p>
                                    <p className="text-5xl sm:text-6xl md:text-7xl font-mono font-black tracking-tight text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                                        {formatSeconds(tracker.elapsedSeconds)}
                                    </p>
                                </div>

                                {/* Telemetry Tiles Grid (Mobile-First) */}
                                <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                                    <div className="p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                                        <p className="text-[10px] sm:text-xs font-semibold text-white/50 uppercase">Distance</p>
                                        <p className="text-lg sm:text-2xl font-mono font-bold text-white mt-1">
                                            {tracker.totalDistanceKm.toFixed(2)} <span className="text-[11px] font-normal text-white/60">km</span>
                                        </p>
                                    </div>

                                    <div className="p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                                        <p className="text-[10px] sm:text-xs font-semibold text-white/50 uppercase">Pace</p>
                                        <p className="text-lg sm:text-2xl font-mono font-bold text-white mt-1">
                                            {tracker.currentPace} <span className="text-[11px] font-normal text-white/60">/km</span>
                                        </p>
                                    </div>

                                    <div className="p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                                        <p className="text-[10px] sm:text-xs font-semibold text-white/50 uppercase">Est. Burn</p>
                                        <p className="text-lg sm:text-2xl font-mono font-bold text-amber-400 mt-1">
                                            {tracker.estimatedCalories} <span className="text-[11px] font-normal text-white/60">kcal</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Dynamic Segmentation Breakdown Counters & Progress Bar */}
                                <div className="space-y-2 p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <div className="flex justify-between text-xs font-semibold text-white/70">
                                        <span>Movement Breakdown</span>
                                        <span className="font-mono text-emerald-400">{activeMovingSeconds}s active</span>
                                    </div>

                                    {/* Segment Progress Bar */}
                                    <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden flex">
                                        {walkPercent > 0 && <div style={{ width: `${walkPercent}%` }} className="h-full bg-emerald-400 transition-all" title={`Walking: ${walkPercent}%`}></div>}
                                        {jogPercent > 0 && <div style={{ width: `${jogPercent}%` }} className="h-full bg-amber-400 transition-all" title={`Jogging: ${jogPercent}%`}></div>}
                                        {runPercent > 0 && <div style={{ width: `${runPercent}%` }} className="h-full bg-rose-500 transition-all" title={`Running: ${runPercent}%`}></div>}
                                        {cyclePercent > 0 && <div style={{ width: `${cyclePercent}%` }} className="h-full bg-blue-500 transition-all" title={`Cycling: ${cyclePercent}%`}></div>}
                                    </div>

                                    {/* Live Segment Counters */}
                                    <div className="grid grid-cols-3 gap-2 pt-1">
                                        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                                            <span className="text-[10px] font-bold text-emerald-400 uppercase">Walking</span>
                                            <p className="text-xs sm:text-sm font-mono font-bold text-white">{formatSeconds(tracker.breakdown.walkingSeconds)}</p>
                                        </div>
                                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                                            <span className="text-[10px] font-bold text-amber-400 uppercase">Jogging</span>
                                            <p className="text-xs sm:text-sm font-mono font-bold text-white">{formatSeconds(tracker.breakdown.joggingSeconds)}</p>
                                        </div>
                                        <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                                            <span className="text-[10px] font-bold text-rose-400 uppercase">Running</span>
                                            <p className="text-xs sm:text-sm font-mono font-bold text-white">{formatSeconds(tracker.breakdown.runningSeconds)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* DEV / DEBUG Diagnostic Panel (Required for mobile real-device testing) */}
                                <div className="p-3.5 rounded-2xl bg-indigo-950/50 border border-indigo-500/30 text-xs font-mono space-y-2 shadow-inner">
                                    <div className="flex justify-between items-center pb-1.5 border-b border-indigo-500/20">
                                        <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">🛠️ DEV DIAGNOSTIC FEED</span>
                                        <span className="text-[10px] text-white/50">{tracker.devTelemetry.lastFixTime}</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                                        <div>
                                            <span className="text-white/50">Secure Context: </span>
                                            <span className={tracker.devTelemetry.isSecureContext ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                                {tracker.devTelemetry.isSecureContext ? 'YES' : 'NO (HTTP)'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-white/50">Permission: </span>
                                            <span className="text-cyan-300 font-bold">{tracker.devTelemetry.permissionQueryState}</span>
                                        </div>
                                        <div>
                                            <span className="text-white/50">GPS API: </span>
                                            <span className={tracker.devTelemetry.isGeolocationAvailable ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                                {tracker.devTelemetry.isGeolocationAvailable ? 'available' : 'unavailable'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-white/50">GPS Status: </span>
                                            <span className="text-amber-300 font-bold">{tracker.devTelemetry.gpsStatus}</span>
                                        </div>
                                        <div>
                                            <span className="text-white/50">Samples: </span>
                                            <span className="text-white font-bold">{tracker.devTelemetry.samplesReceived}</span>
                                        </div>
                                        <div>
                                            <span className="text-white/50">Last accuracy: </span>
                                            <span className="text-emerald-400 font-bold">
                                                {tracker.devTelemetry.gpsAccuracy ? `±${tracker.devTelemetry.gpsAccuracy} m` : '--'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-white/50">Raw speed: </span>
                                            <span className="text-cyan-300">
                                                {tracker.devTelemetry.rawBrowserSpeedKmh !== null ? `${tracker.devTelemetry.rawBrowserSpeedKmh} km/h` : '--'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-white/50">Calculated: </span>
                                            <span className="text-amber-300 font-bold">{tracker.devTelemetry.calculatedCoordSpeedKmh} km/h</span>
                                        </div>
                                        <div>
                                            <span className="text-white/50">Smoothed: </span>
                                            <span className="text-emerald-400 font-bold">{tracker.devTelemetry.smoothedSpeedKmh} km/h</span>
                                        </div>
                                        <div>
                                            <span className="text-white/50">Distance inc: </span>
                                            <span className="text-white font-bold">+{tracker.devTelemetry.lastDistanceIncMeters} m</span>
                                        </div>
                                    </div>

                                    {tracker.devTelemetry.lastErrorCode && (
                                        <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-[10px] text-rose-200">
                                            <span className="font-bold">Error {tracker.devTelemetry.lastErrorCode}: </span>
                                            <span>{tracker.devTelemetry.lastErrorMessage}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Simulator Preset Controls (When simulation is ON) */}
                                {tracker.isSimulating && (
                                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2.5">
                                        <div className="flex justify-between items-center text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                                            <span>Simulate Movement Presets:</span>
                                            <span className="text-[10px] font-normal text-white/60">Active: {tracker.simulatedPreset}</span>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[
                                                { id: 'WALK', label: 'WALK (~4 km/h)', color: 'border-emerald-500/40 text-emerald-300' },
                                                { id: 'JOG', label: 'JOG (~8 km/h)', color: 'border-amber-500/40 text-amber-300' },
                                                { id: 'RUN', label: 'RUN (~13 km/h)', color: 'border-rose-500/40 text-rose-300' },
                                                { id: 'IDLE', label: 'PAUSE (0 km/h)', color: 'border-slate-500/40 text-slate-300' },
                                            ].map((btn) => (
                                                <button
                                                    key={btn.id}
                                                    type="button"
                                                    onClick={() => tracker.setSimulatedPreset(btn.id as any)}
                                                    className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all border text-center ${
                                                        tracker.simulatedPreset === btn.id
                                                            ? `bg-white/20 ${btn.color} shadow-md scale-[1.03]`
                                                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                                                    }`}
                                                >
                                                    {btn.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Touch Controls (Pause / Resume / Stop) */}
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    {tracker.status === 'tracking' ? (
                                        <button
                                            type="button"
                                            onClick={tracker.pauseTracking}
                                            className="h-14 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-base flex items-center justify-center space-x-2 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                                        >
                                            <Pause className="w-5 h-5 fill-current" />
                                            <span>PAUSE</span>
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={tracker.resumeTracking}
                                            className="h-14 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-base flex items-center justify-center space-x-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                        >
                                            <Play className="w-5 h-5 fill-current" />
                                            <span>RESUME</span>
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={tracker.stopTracking}
                                        className="h-14 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-base flex items-center justify-center space-x-2 transition-all shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                                    >
                                        <Square className="w-5 h-5 fill-current" />
                                        <span>STOP</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 3. SESSION SUMMARY & SAVE SCREEN */}
                        {tracker.status === 'stopped' && (
                            <div className="glass-card p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200">
                                {savedResponse ? (
                                    <div className="text-center py-8 space-y-4">
                                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(16,185,129,0.4)]">
                                            <CheckCircle2 className="w-9 h-9" />
                                        </div>
                                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Activity Saved!</h2>
                                        <p className="text-sm text-emerald-400 font-semibold">
                                            +{savedResponse.points} points added to your score!
                                        </p>
                                        <p className="text-xs text-white/50">Redirecting to dashboard...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-center space-y-1">
                                            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-1">
                                                <Sparkles className="w-3.5 h-3.5" />
                                                <span>Activity Complete</span>
                                            </div>
                                            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Session Summary</h2>
                                            <p className="text-xs text-white/60">Classified as dominant sport: <span className="text-white font-bold">{tracker.dominantSport}</span></p>
                                        </div>

                                        {saveError && (
                                            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
                                                {saveError}
                                            </div>
                                        )}

                                        {/* Metrics Overview Cards */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                                                <span className="text-[11px] font-semibold text-white/50 uppercase">Total Time</span>
                                                <p className="text-xl font-mono font-bold text-white mt-1">{formatSeconds(tracker.elapsedSeconds)}</p>
                                            </div>

                                            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                                                <span className="text-[11px] font-semibold text-white/50 uppercase">Distance</span>
                                                <p className="text-xl font-mono font-bold text-white mt-1">{tracker.totalDistanceKm.toFixed(2)} km</p>
                                            </div>

                                            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                                                <span className="text-[11px] font-semibold text-white/50 uppercase">Est. Calories</span>
                                                <p className="text-xl font-mono font-bold text-amber-400 mt-1">{tracker.estimatedCalories} kcal</p>
                                            </div>

                                            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                                                <span className="text-[11px] font-semibold text-white/50 uppercase">Est. Points</span>
                                                <p className="text-xl font-mono font-bold text-[var(--accent)] mt-1">+{tracker.estimatedPoints}</p>
                                            </div>
                                        </div>

                                        {/* Dynamic Movement Breakdown Table */}
                                        <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                                            <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                                <span className="text-xs font-bold text-white uppercase tracking-wider">Dynamic Segmentation</span>
                                                <span className="text-xs text-white/50">Duration & Ratio</span>
                                            </div>

                                            <div className="space-y-2.5 text-xs">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                                                        <span className="font-semibold text-white">Walking (0.8–6 km/h)</span>
                                                    </div>
                                                    <div className="flex items-center space-x-3">
                                                        <span className="font-mono text-white/80">{formatSeconds(tracker.breakdown.walkingSeconds)}</span>
                                                        <span className="text-[11px] font-medium text-emerald-400 w-10 text-right">{walkPercent}%</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                                                        <span className="font-semibold text-white">Jogging (6–10 km/h)</span>
                                                    </div>
                                                    <div className="flex items-center space-x-3">
                                                        <span className="font-mono text-white/80">{formatSeconds(tracker.breakdown.joggingSeconds)}</span>
                                                        <span className="text-[11px] font-medium text-amber-400 w-10 text-right">{jogPercent}%</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                                                        <span className="font-semibold text-white">Running (10+ km/h)</span>
                                                    </div>
                                                    <div className="flex items-center space-x-3">
                                                        <span className="font-mono text-white/80">{formatSeconds(tracker.breakdown.runningSeconds)}</span>
                                                        <span className="text-[11px] font-medium text-rose-400 w-10 text-right">{runPercent}%</span>
                                                    </div>
                                                </div>

                                                {tracker.breakdown.cyclingSeconds > 0 && (
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                                                            <span className="font-semibold text-white">Cycling</span>
                                                        </div>
                                                        <div className="flex items-center space-x-3">
                                                            <span className="font-mono text-white/80">{formatSeconds(tracker.breakdown.cyclingSeconds)}</span>
                                                            <span className="text-[11px] font-medium text-blue-400 w-10 text-right">{cyclePercent}%</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Save & Discard Buttons */}
                                        <div className="space-y-2.5 pt-2">
                                            <button
                                                type="button"
                                                disabled={isSaving}
                                                onClick={handleSaveAutoTrack}
                                                className="auth-submit-btn w-full h-14 rounded-2xl flex items-center justify-center font-bold text-base shadow-xl disabled:opacity-50"
                                            >
                                                {isSaving ? (
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                ) : (
                                                    <span>SAVE ACTIVITY & EARN POINTS</span>
                                                )}
                                            </button>

                                            <button
                                                type="button"
                                                disabled={isSaving}
                                                onClick={tracker.resetTracker}
                                                className="w-full h-11 rounded-xl text-xs font-semibold text-white/50 hover:text-white/80 hover:bg-white/5 transition-all"
                                            >
                                                Discard Session
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ======================================================== */}
                {/* MODE 2: MANUAL TIMER (GYM & SWIMMING ONLY) */}
                {/* ======================================================== */}
                {mode === 'MANUAL_TIMER' && (
                    <div className="glass-card p-6 sm:p-8 space-y-6">
                        <div>
                            <h2 className="text-lg font-bold text-white mb-1">Indoor Workout Timer</h2>
                            <p className="text-xs text-white/60">Dedicated timer for Gym lifting sessions and Swimming pool sets.</p>
                        </div>

                        {/* Sport Selector */}
                        {manualTimerState === 'idle' && (
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setManualSport('GYM')}
                                    className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${
                                        manualSport === 'GYM'
                                            ? 'bg-purple-500/20 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                                            : 'bg-white/5 border-white/10 opacity-70 hover:opacity-100'
                                    }`}
                                >
                                    <Dumbbell className="w-7 h-7 text-purple-400" />
                                    <span className="text-sm font-bold text-white">Gym Session</span>
                                    <span className="text-[11px] text-white/50">5 points / min</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setManualSport('SWIMMING')}
                                    className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${
                                        manualSport === 'SWIMMING'
                                            ? 'bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                                            : 'bg-white/5 border-white/10 opacity-70 hover:opacity-100'
                                    }`}
                                >
                                    <Droplets className="w-7 h-7 text-cyan-400" />
                                    <span className="text-sm font-bold text-white">Swimming</span>
                                    <span className="text-[11px] text-white/50">15 points / min</span>
                                </button>
                            </div>
                        )}

                        {/* Timer Display */}
                        <div className="text-center py-6">
                            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-semibold mb-3">
                                <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                                <span>{manualSport === 'GYM' ? 'Gym Timer' : 'Swim Timer'}</span>
                            </div>
                            <p className="text-6xl sm:text-7xl font-mono font-black text-white tracking-tight">
                                {formatSeconds(manualSeconds)}
                            </p>
                        </div>

                        {/* Estimated Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                                <span className="text-xs text-white/50">Est. Calories</span>
                                <p className="text-xl font-mono font-bold text-amber-400 mt-1">
                                    {Math.round((manualSeconds / 60) * (manualSport === 'GYM' ? 6 : 10))} kcal
                                </p>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                                <span className="text-xs text-white/50">Points Rate</span>
                                <p className="text-xl font-mono font-bold text-[var(--accent)] mt-1">
                                    +{Math.floor(manualSeconds / 60) * (manualSport === 'GYM' ? 5 : 15)} pts
                                </p>
                            </div>
                        </div>

                        {saveError && (
                            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
                                {saveError}
                            </div>
                        )}

                        {/* Controls */}
                        <div className="space-y-3 pt-2">
                            {manualTimerState === 'idle' && (
                                <button
                                    type="button"
                                    onClick={() => setManualTimerState('running')}
                                    className="auth-submit-btn w-full h-14 rounded-2xl flex items-center justify-center space-x-2 text-base font-bold"
                                >
                                    <Play className="w-5 h-5 fill-current" />
                                    <span>START TIMER</span>
                                </button>
                            )}

                            {manualTimerState === 'running' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setManualTimerState('paused')}
                                        className="h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold flex items-center justify-center space-x-2"
                                    >
                                        <Pause className="w-5 h-5 fill-current" />
                                        <span>PAUSE</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setManualTimerState('stopped')}
                                        className="h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold flex items-center justify-center space-x-2"
                                    >
                                        <Square className="w-5 h-5 fill-current" />
                                        <span>STOP</span>
                                    </button>
                                </div>
                            )}

                            {manualTimerState === 'paused' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setManualTimerState('running')}
                                        className="h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold flex items-center justify-center space-x-2"
                                    >
                                        <Play className="w-5 h-5 fill-current" />
                                        <span>RESUME</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setManualTimerState('stopped')}
                                        className="h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold flex items-center justify-center space-x-2"
                                    >
                                        <Square className="w-5 h-5 fill-current" />
                                        <span>STOP</span>
                                    </button>
                                </div>
                            )}

                            {manualTimerState === 'stopped' && (
                                <div className="space-y-2.5">
                                    <button
                                        type="button"
                                        disabled={isSaving || manualSeconds < 5}
                                        onClick={handleSaveManualTimer}
                                        className="auth-submit-btn w-full h-14 rounded-2xl flex items-center justify-center font-bold text-base disabled:opacity-50"
                                    >
                                        {isSaving ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <span>SAVE {manualSport} SESSION</span>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setManualTimerState('idle');
                                            setManualSeconds(0);
                                        }}
                                        className="w-full h-11 rounded-xl text-xs font-semibold text-white/50 hover:text-white/80 hover:bg-white/5 transition-all"
                                    >
                                        Reset Timer
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AddActivity;
