import React, { useState } from 'react';
import type { ActivityHistory as ActivityType, RoutePoint } from '../types';
import { 
    Share2, 
    Copy, 
    Check, 
    Shield, 
    AlertTriangle, 
    Flame, 
    Zap, 
    Activity as ActivityIcon
} from 'lucide-react';

interface ShareActivityCardProps {
    activity: ActivityType;
    routePoints?: RoutePoint[];
    streakDays?: number;
    xpEarned?: number;
    privacyTrimmed?: boolean;
    onTogglePrivacy?: (isPrivacy: boolean) => void;
}

const ShareActivityCard: React.FC<ShareActivityCardProps> = ({
    activity,
    streakDays = 5,
    xpEarned = 50,
    privacyTrimmed = true,
    onTogglePrivacy
}) => {
    const [copied, setCopied] = useState<boolean>(false);
    const [privacyMode, setPrivacyMode] = useState<boolean>(privacyTrimmed);
    const [showExactWarning, setShowExactWarning] = useState<boolean>(false);

    const distance = activity.distanceKm ? Number(activity.distanceKm).toFixed(2) : '0.00';
    const totalSecs = activity.totalDurationSeconds || (activity.durationMinutes ? activity.durationMinutes * 60 + (activity.durationSeconds || 0) : 0);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const durationFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    const paceFormatted = (() => {
        const distNum = Number(activity.distanceKm);
        if (!distNum || distNum <= 0 || totalSecs <= 0) return '--:--';
        const minsPerKm = (totalSecs / 60) / distNum;
        const pMins = Math.floor(minsPerKm);
        const pSecs = Math.round((minsPerKm - pMins) * 60);
        if (pMins > 59) return '--:--';
        return `${pMins}:${pSecs < 10 ? '0' : ''}${pSecs} /km`;
    })();

    const handlePrivacyToggle = (newMode: boolean) => {
        if (!newMode) {
            setShowExactWarning(true);
        } else {
            setPrivacyMode(true);
            setShowExactWarning(false);
            if (onTogglePrivacy) onTogglePrivacy(true);
        }
    };

    const confirmExactRoute = () => {
        setPrivacyMode(false);
        setShowExactWarning(false);
        if (onTogglePrivacy) onTogglePrivacy(false);
    };

    const shareText = `🏃 Just finished a ${distance} km ${activity.sport.replace('_', ' ')} workout in ${durationFormatted} with StrideMate! 🔥 ${streakDays} Day Streak | ⚡ +${xpEarned} XP #StrideMate #Fitness`;

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `StrideMate ${activity.sport} Workout`,
                    text: shareText,
                    url: window.location.origin
                });
                return;
            } catch (err) {
                // User cancelled or share failed, fallback to copy
            }
        }

        // Fallback: Copy to Clipboard
        navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    return (
        <div className="space-y-4">
            {/* Privacy Route Selector */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <div>
                        <span className="font-bold text-[var(--text)]">Route Privacy:</span>{' '}
                        <span className="text-[var(--text-muted)]">
                            {privacyMode ? 'Protected (Start & finish obscured)' : 'Exact coordinates'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center space-x-1 bg-white/10 p-0.5 rounded-xl font-bold">
                    <button
                        onClick={() => handlePrivacyToggle(true)}
                        className={`px-3 py-1 rounded-lg transition-all ${privacyMode ? 'bg-emerald-500 text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-white'}`}
                    >
                        Privacy
                    </button>
                    <button
                        onClick={() => handlePrivacyToggle(false)}
                        className={`px-3 py-1 rounded-lg transition-all ${!privacyMode ? 'bg-amber-500 text-black shadow-sm' : 'text-[var(--text-muted)] hover:text-white'}`}
                    >
                        Exact
                    </button>
                </div>
            </div>

            {/* Exact Route Privacy Warning Modal/Alert */}
            {showExactWarning && (
                <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs space-y-2 animate-in fade-in">
                    <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>
                            Exact routes include precise home or office starting coordinates. Are you sure you want to disable privacy trimming for this share card?
                        </span>
                    </div>
                    <div className="flex items-center space-x-2 justify-end">
                        <button
                            onClick={() => setShowExactWarning(false)}
                            className="px-3 py-1 rounded-lg bg-white/10 text-white font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmExactRoute}
                            className="px-3 py-1 rounded-lg bg-amber-500 text-black font-bold"
                        >
                            Enable Exact
                        </button>
                    </div>
                </div>
            )}

            {/* Visual StrideMate Share Card */}
            <div id="stridemate-share-card" className="p-6 sm:p-7 rounded-3xl glass-card border border-white/15 bg-gradient-to-br from-[var(--surface-elevated)] via-[var(--surface)] to-[var(--accent)]/10 space-y-6 shadow-2xl relative overflow-hidden">
                {/* Brand Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center space-x-2.5">
                        <div className="p-2 rounded-xl bg-[var(--accent)] text-white shadow-[0_0_12px_var(--glow-purple)]">
                            <ActivityIcon className="w-4 h-4" />
                        </div>
                        <span className="text-base font-black tracking-widest text-[var(--text)] uppercase">
                            STRIDEMATE
                        </span>
                    </div>

                    <span className="text-xs uppercase font-extrabold px-3 py-1 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)]">
                        {activity.sport.replace('_', ' ')}
                    </span>
                </div>

                {/* Main Metrics Grid */}
                <div className="grid grid-cols-3 gap-3 text-center py-2">
                    <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Distance</span>
                        <div className="text-2xl sm:text-3xl font-black text-[var(--text)] tracking-tight">
                            {distance} <span className="text-xs font-semibold text-[var(--text-muted)]">KM</span>
                        </div>
                    </div>

                    <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Duration</span>
                        <div className="text-2xl sm:text-3xl font-black text-[var(--text)] tracking-tight">
                            {durationFormatted}
                        </div>
                    </div>

                    <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Pace</span>
                        <div className="text-2xl sm:text-3xl font-black text-[var(--text)] tracking-tight">
                            {paceFormatted.split(' ')[0]} <span className="text-xs font-semibold text-[var(--text-muted)]">/KM</span>
                        </div>
                    </div>
                </div>

                {/* Gamification Highlights Banner */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 text-xs">
                    <div className="flex items-center space-x-2 text-amber-400 font-bold justify-center">
                        <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span>{streakDays} DAY STREAK</span>
                    </div>

                    <div className="flex items-center space-x-2 text-[var(--accent)] font-bold justify-center">
                        <Zap className="w-4 h-4 fill-[var(--accent)] text-[var(--accent)]" />
                        <span>+{activity.points || xpEarned} XP EARNED</span>
                    </div>
                </div>

                {/* Footer Attribution */}
                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] border-t border-white/10 pt-3">
                    <span>{new Date(activity.recordedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span className="font-semibold text-[var(--text)]">Powered by StrideMate</span>
                </div>
            </div>

            {/* Share Action Buttons */}
            <div className="flex items-center gap-3 pt-1">
                <button
                    onClick={handleShare}
                    className="flex-1 py-3 px-4 rounded-xl auth-submit-btn text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-lg"
                >
                    <Share2 className="w-4 h-4" />
                    <span>Share Activity Card</span>
                </button>

                <button
                    onClick={() => {
                        navigator.clipboard.writeText(shareText);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2500);
                    }}
                    className="p-3 rounded-xl bg-white/10 hover:bg-white/15 text-[var(--text)] text-xs font-bold transition-all flex items-center space-x-1.5"
                    title="Copy Share Text"
                >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </button>
            </div>
        </div>
    );
};

export default ShareActivityCard;
