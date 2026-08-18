import React from 'react';
import { Flame, Trophy } from 'lucide-react';

interface StreakWidgetProps {
    currentStreak: number;
    longestStreak: number;
    last7DaysActive?: boolean[];
}

const StreakWidget: React.FC<StreakWidgetProps> = ({ currentStreak, longestStreak, last7DaysActive = [false, false, false, false, false, false, false] }) => {
    const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
        <div className="glass-card p-5 sm:p-6 space-y-4 border-amber-500/20 shadow-[0_0_25px_rgba(245,158,11,0.15)] relative overflow-hidden">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
                        <Flame className="w-6 h-6 fill-amber-400 animate-pulse" />
                    </div>
                    <div>
                        <p className="text-xs uppercase font-bold text-amber-300 tracking-wider">Active Streak</p>
                        <p className="text-2xl sm:text-3xl font-black text-white font-mono">{currentStreak} <span className="text-sm font-semibold text-white/60">Days</span></p>
                    </div>
                </div>

                <div className="text-right">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1 justify-end">
                        <Trophy className="w-3 h-3 text-amber-400/80" /> Best
                    </span>
                    <p className="text-sm font-bold text-amber-400 font-mono">{longestStreak} Days</p>
                </div>
            </div>

            {/* 7-Day Streak Calendar Visual */}
            <div className="pt-2 border-t border-white/10 space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-white/50 px-1">
                    <span>7-Day Consistency</span>
                    <span>{currentStreak > 0 ? '🔥 On Fire' : 'Start streak'}</span>
                </div>
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {last7DaysActive.map((isActive, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-1">
                            <div
                                className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all ${
                                    isActive
                                        ? 'bg-gradient-to-tr from-amber-500 to-orange-400 text-white shadow-[0_0_10px_rgba(245,158,11,0.4)] scale-105'
                                        : 'bg-white/5 border border-white/10 text-white/30'
                                }`}
                            >
                                {isActive ? <Flame className="w-3.5 h-3.5 fill-white" /> : <span className="text-[10px] font-bold">•</span>}
                            </div>
                            <span className="text-[10px] font-mono text-white/40">{daysOfWeek[idx % 7]}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StreakWidget;
