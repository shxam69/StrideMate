import React from 'react';
import { Zap, Sparkles, Crown } from 'lucide-react';

interface LevelCardProps {
    level: number;
    xp: number;
    nextLevelXp: number;
    totalXp: number;
}

const LevelCard: React.FC<LevelCardProps> = ({ level, xp, nextLevelXp, totalXp }) => {
    const percent = Math.min(100, Math.round((xp / Math.max(1, nextLevelXp)) * 100));

    return (
        <div className="glass-card p-5 sm:p-6 space-y-4 border-purple-500/20 shadow-[0_0_25px_rgba(168,85,247,0.15)] relative overflow-hidden">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] border border-purple-400/30">
                        <Crown className="w-6 h-6 text-amber-300" />
                    </div>
                    <div>
                        <div className="flex items-center space-x-2">
                            <span className="text-xs uppercase font-bold text-purple-300 tracking-wider">Player Tier</span>
                            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-extrabold border border-purple-500/30">
                                RANK {level}
                            </span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">Level {level}</p>
                    </div>
                </div>

                <div className="text-right">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1 justify-end">
                        <Zap className="w-3 h-3 text-amber-400" /> Total XP
                    </span>
                    <p className="text-base sm:text-lg font-black text-amber-400 font-mono">
                        {totalXp.toLocaleString()} <span className="text-xs font-normal text-white/50">XP</span>
                    </p>
                </div>
            </div>

            {/* XP Progress Bar */}
            <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-white/60 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        Next Level Progress
                    </span>
                    <span className="text-white/80 font-mono text-[11px]">
                        {xp} / {nextLevelXp} XP ({percent}%)
                    </span>
                </div>
                <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden p-0.5 border border-white/10">
                    <div
                        style={{ width: `${percent}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-400 to-pink-500 transition-all duration-700 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                    />
                </div>
            </div>
        </div>
    );
};

export default LevelCard;
