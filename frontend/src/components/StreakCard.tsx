import React from 'react';
import { Flame, CheckCircle, Circle } from 'lucide-react';

interface StreakCardProps {
    currentStreak: number;
    longestStreak: number;
    activeToday: boolean;
}

const StreakCard: React.FC<StreakCardProps> = ({ currentStreak, longestStreak, activeToday }) => {
    return (
        <div className="glass-card p-5 md:p-6 flex flex-col justify-between h-full relative overflow-hidden group">
            {/* Background gradient hint */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-3 rounded-2xl bg-orange-500/10 border-orange-500/20 border text-orange-500">
                    <Flame className="w-6 h-6" />
                </div>
                
                <div className="flex items-center space-x-1.5 bg-[var(--surface)] border border-[var(--glass-border)] px-3 py-1 rounded-full">
                    {activeToday ? (
                        <>
                            <CheckCircle className="w-3.5 h-3.5 text-[var(--success)]" />
                            <span className="text-xs font-medium text-[var(--text)]">Active Today</span>
                        </>
                    ) : (
                        <>
                            <Circle className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                            <span className="text-xs font-medium text-[var(--text-muted)]">No Activity Yet</span>
                        </>
                    )}
                </div>
            </div>
            
            <div className="relative z-10">
                <h3 className="text-xs md:text-sm font-medium text-[var(--text-muted)] tracking-wide uppercase mb-1 flex items-center gap-1.5">
                    Current Streak
                </h3>
                <div className="flex items-baseline space-x-2">
                    <p className="text-3xl md:text-4xl font-bold text-[var(--text)] tracking-tight">
                        {currentStreak} <span className="text-lg md:text-xl font-semibold text-[var(--text-muted)]">days</span>
                    </p>
                </div>
                
                <div className="mt-3 pt-3 border-t border-[var(--glass-border)] flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--text-muted)]">Longest Streak</span>
                    <span className="text-sm font-bold text-[var(--text)]">{longestStreak} days</span>
                </div>
            </div>
        </div>
    );
};

export default StreakCard;
