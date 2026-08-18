import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { ActivitySaveResult } from '../types';
import { 
    Trophy, 
    Flame, 
    Zap, 
    Sparkles, 
    CheckCircle2, 
    ArrowRight, 
    History,
    Crown,
    Target
} from 'lucide-react';

interface ActivityCelebrationModalProps {
    result: ActivitySaveResult;
    onClose: () => void;
}

const ActivityCelebrationModal: React.FC<ActivityCelebrationModalProps> = ({ result, onClose }) => {
    const navigate = useNavigate();

    const xpPercent = Math.min(100, Math.round((result.currentXp / Math.max(1, result.nextLevelXp)) * 100));

    const handleGoDashboard = () => {
        onClose();
        navigate('/dashboard');
    };

    const handleGoHistory = () => {
        onClose();
        navigate('/history');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-full max-w-md glass-card p-6 sm:p-8 space-y-6 text-center border-[var(--accent)]/40 shadow-[0_0_50px_rgba(99,102,241,0.35)] animate-in zoom-in-95 duration-300">
                
                {/* Level Up Flash / Celebration Banner */}
                {result.levelUp ? (
                    <div className="space-y-2">
                        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/30 via-purple-500/30 to-amber-500/30 border border-amber-400/50 text-amber-300 text-xs font-black uppercase tracking-widest animate-bounce">
                            <Crown className="w-4 h-4 text-amber-400" />
                            <span>LEVEL UP!</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-purple-200 to-pink-300 tracking-tight">
                            Level {result.level} Reached!
                        </h2>
                    </div>
                ) : (
                    <div className="space-y-1">
                        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Activity Saved</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                            Workout Complete!
                        </h2>
                    </div>
                )}

                {/* XP & Points Gained Card */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex justify-around items-center">
                        <div>
                            <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Score</span>
                            <p className="text-2xl sm:text-3xl font-mono font-black text-[var(--accent)]">
                                +{result.pointsEarned} <span className="text-xs font-medium text-white/60">pts</span>
                            </p>
                        </div>
                        <div className="h-8 w-px bg-white/10"></div>
                        <div>
                            <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Experience</span>
                            <p className="text-2xl sm:text-3xl font-mono font-black text-amber-400 flex items-center justify-center gap-1">
                                <Zap className="w-5 h-5 fill-amber-400" />
                                +{result.xpEarned} <span className="text-xs font-medium text-white/60">XP</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Level Progress Bar */}
                <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/20 space-y-2.5 text-left">
                    <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-purple-300 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            Level {result.level} Progression
                        </span>
                        <span className="text-white/60 font-mono">
                            {result.currentXp} / {result.nextLevelXp} XP
                        </span>
                    </div>
                    <div className="h-3.5 w-full rounded-full bg-white/10 overflow-hidden p-0.5 border border-white/10">
                        <div 
                            style={{ width: `${xpPercent}%` }}
                            className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-400 to-pink-500 transition-all duration-700 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                        />
                    </div>
                </div>

                {/* Streak Celebration Banner */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between">
                    <div className="flex items-center space-x-3 text-left">
                        <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                            <Flame className="w-6 h-6 fill-amber-400 animate-pulse" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-amber-300 uppercase tracking-wide">Daily Streak</p>
                            <p className="text-lg font-black text-white font-mono">{result.currentStreak} Days Active</p>
                        </div>
                    </div>
                    {result.currentStreak >= result.longestStreak && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold">
                            🏆 BEST
                        </span>
                    )}
                </div>

                {/* Quests Completed (if any) */}
                {result.completedQuests && result.completedQuests.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 text-left">
                        <p className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5" />
                            Daily Quest Completed!
                        </p>
                        <div className="space-y-1.5">
                            {result.completedQuests.map((q) => (
                                <div key={q.id} className="flex justify-between items-center text-xs">
                                    <span className="text-white font-medium">{q.title}</span>
                                    <span className="text-amber-300 font-bold font-mono">+{q.rewardXp} XP</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Achievements Unlocked (if any) */}
                {result.unlockedAchievements && result.unlockedAchievements.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-400/40 space-y-2 text-left">
                        <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Trophy className="w-3.5 h-3.5 text-amber-400" />
                            Achievement Unlocked!
                        </p>
                        <div className="space-y-1.5">
                            {result.unlockedAchievements.map((ach) => (
                                <div key={ach.code} className="flex justify-between items-center text-xs">
                                    <div>
                                        <p className="text-white font-bold">{ach.name}</p>
                                        <p className="text-[10px] text-white/60">{ach.description}</p>
                                    </div>
                                    <span className="text-amber-300 font-bold font-mono">+{ach.rewardXp} XP</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2.5 pt-2">
                    <button
                        type="button"
                        onClick={handleGoDashboard}
                        className="auth-submit-btn w-full h-14 rounded-2xl flex items-center justify-center space-x-2 font-bold text-base shadow-2xl active:scale-[0.98] transition-transform"
                    >
                        <span>CONTINUE TO DASHBOARD</span>
                        <ArrowRight className="w-5 h-5" />
                    </button>

                    <button
                        type="button"
                        onClick={handleGoHistory}
                        className="w-full h-11 rounded-xl text-xs font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center space-x-1.5"
                    >
                        <History className="w-4 h-4" />
                        <span>View in Activity History</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActivityCelebrationModal;
