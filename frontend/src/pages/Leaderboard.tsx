import React, { useEffect, useState } from 'react';
import type { LeaderboardEntry } from '../types';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { Trophy, TrendingUp, TrendingDown, Minus, Circle, Calendar, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type TimeFrame = 'GLOBAL' | 'WEEKLY' | 'MONTHLY';

const Leaderboard: React.FC = () => {
    const [timeframe, setTimeframe] = useState<TimeFrame>('GLOBAL');
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        setLoading(true);
        let endpoint = '/leaderboard';
        if (timeframe === 'WEEKLY') endpoint = '/leaderboard/weekly';
        if (timeframe === 'MONTHLY') endpoint = '/leaderboard/monthly';

        api.get(endpoint)
            .then(res => setEntries(res.data))
            .catch(err => console.error('Leaderboard error', err))
            .finally(() => setLoading(false));
    }, [timeframe]);

    const renderTrendIcon = (trend: string) => {
        switch (trend) {
            case 'UP': return <TrendingUp className="w-5 h-5 text-[var(--success)]" />;
            case 'DOWN': return <TrendingDown className="w-5 h-5 text-[var(--danger)]" />;
            case 'FLAT': return <Minus className="w-5 h-5 text-[var(--text-muted)]" />;
            default: return <Circle className="w-5 h-5 opacity-50 text-[var(--text-muted)]" />;
        }
    };

    const top3 = entries.slice(0, 3);
    const remaining = entries.slice(3);

    // Rearrange top 3 for a visual podium: Rank 2, Rank 1, Rank 3
    const podiumOrder = [];
    if (top3[1]) podiumOrder.push(top3[1]);
    if (top3[0]) podiumOrder.push(top3[0]);
    if (top3[2]) podiumOrder.push(top3[2]);

    const getPodiumHeight = (rank: number) => {
        if (rank === 1) return 'h-40 md:h-48';
        if (rank === 2) return 'h-32 md:h-36';
        return 'h-24 md:h-24';
    };

    const getPodiumMedal = (rank: number) => {
        if (rank === 1) return 'text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]';
        if (rank === 2) return 'text-slate-400 drop-shadow-[0_0_10px_rgba(148,163,184,0.5)]';
        return 'text-amber-700 drop-shadow-[0_0_10px_rgba(180,83,9,0.5)]';
    };

    return (
        <div className="min-h-screen pb-16">
            <Navbar />
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 relative z-10 space-y-6">
                {/* Header & Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3 md:space-x-4">
                        <div className="p-3 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-2xl shadow-[0_0_15px_var(--glow-purple)]">
                            <Trophy className="w-6 h-6 md:w-8 md:h-8 text-[var(--accent)]" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-4xl font-bold text-[var(--text)] tracking-tight">ATHLETE RANKINGS</h1>
                            <p className="text-sm text-[var(--text-muted)] mt-0.5">Competitive standings across global and time-framed tiers.</p>
                        </div>
                    </div>

                    {/* Time-frame selector tabs */}
                    <div className="flex items-center space-x-1.5 p-1 rounded-2xl bg-white/5 border border-white/10 self-start">
                        <button
                            onClick={() => setTimeframe('GLOBAL')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                timeframe === 'GLOBAL'
                                    ? 'bg-[var(--accent)] text-white shadow-[0_0_10px_var(--glow-purple)]'
                                    : 'text-white/60 hover:text-white'
                            }`}
                        >
                            <Globe className="w-3.5 h-3.5" />
                            <span>Global</span>
                        </button>
                        <button
                            onClick={() => setTimeframe('WEEKLY')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                timeframe === 'WEEKLY'
                                    ? 'bg-[var(--accent)] text-white shadow-[0_0_10px_var(--glow-purple)]'
                                    : 'text-white/60 hover:text-white'
                            }`}
                        >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Weekly</span>
                        </button>
                        <button
                            onClick={() => setTimeframe('MONTHLY')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                timeframe === 'MONTHLY'
                                    ? 'bg-[var(--accent)] text-white shadow-[0_0_10px_var(--glow-purple)]'
                                    : 'text-white/60 hover:text-white'
                            }`}
                        >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Monthly</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--accent)] mx-auto mb-3"></div>
                        <p className="text-xs text-white/50">Calculating {timeframe.toLowerCase()} rankings...</p>
                    </div>
                ) : entries.length > 0 ? (
                    <>
                        {/* Podium Section */}
                        <div className="flex items-end justify-center gap-2 md:gap-6 mb-8 md:mb-12 h-56 md:h-64 mt-12 md:mt-10">
                            {podiumOrder.map((entry) => {
                                const isMe = user?.id === entry.userId;
                                return (
                                    <div key={entry.userId} className="flex flex-col items-center w-24 md:w-40 relative group">
                                        <div className="text-center mb-4 absolute -top-16 w-full">
                                            <Trophy className={`w-6 h-6 md:w-8 md:h-8 mx-auto mb-1 md:mb-2 ${getPodiumMedal(entry.rank)}`} />
                                            <p className="font-bold text-[var(--text)] text-xs md:text-base truncate px-1 md:px-2">{entry.firstName}</p>
                                            <p className="text-[var(--accent)] font-bold text-xs md:text-sm">{entry.totalPoints.toLocaleString()} pts</p>
                                        </div>
                                        
                                        <div className={`w-full ${getPodiumHeight(entry.rank)} glass-panel rounded-t-xl border-b-0 flex items-start justify-center pt-2 md:pt-4 relative overflow-hidden transition-all duration-300 ${isMe ? 'bg-[var(--accent)]/20 border-[var(--accent)]/50 shadow-[0_-10px_30px_rgba(99,102,241,0.2)]' : ''}`}>
                                            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-[var(--text)]/5 pointer-events-none"></div>
                                            <span className="text-2xl md:text-4xl font-bold text-[var(--text)]/30">
                                                {entry.rank}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* List Section */}
                        {remaining.length > 0 && (
                            <div className="glass-card overflow-hidden">
                                <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-4 border-b border-[var(--border)] text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider bg-[var(--surface-elevated)]">
                                    <div className="col-span-2">Rank</div>
                                    <div className="col-span-5">Athlete</div>
                                    <div className="col-span-3 text-right">Total Points</div>
                                    <div className="col-span-2 text-center">24h Trend</div>
                                </div>
                                
                                <div className="divide-y divide-[var(--border)]">
                                    {remaining.map((entry) => {
                                        const isMe = user?.id === entry.userId;
                                        return (
                                            <div 
                                                key={entry.userId} 
                                                className={`flex flex-col sm:grid sm:grid-cols-12 gap-2 sm:gap-4 justify-center sm:items-center px-4 sm:px-6 py-4 transition-colors duration-200 ${isMe ? 'bg-[var(--accent)]/10 border-l-4 border-[var(--accent)]' : 'hover:bg-[var(--surface-elevated)] border-l-4 border-transparent'}`}
                                            >
                                                {/* Mobile top row */}
                                                <div className="flex sm:hidden items-center justify-between w-full mb-1">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-bold text-[var(--text-muted)] text-sm">#{entry.rank}</span>
                                                        <span className="font-bold text-[var(--text)] text-base">{entry.firstName} {entry.lastName}</span>
                                                        {isMe && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30">YOU</span>}
                                                    </div>
                                                    <div>{renderTrendIcon(entry.trend)}</div>
                                                </div>

                                                {/* Mobile bottom row */}
                                                <div className="flex sm:hidden items-center justify-between w-full">
                                                    <span className="text-xs text-[var(--text-muted)]">Points</span>
                                                    <span className="font-bold text-[var(--accent)] text-sm">{entry.totalPoints.toLocaleString()}</span>
                                                </div>

                                                {/* Desktop layout */}
                                                <div className="hidden sm:block col-span-2 font-bold text-[var(--text-muted)] text-base">
                                                    #{entry.rank}
                                                </div>
                                                <div className="hidden sm:flex col-span-5 items-center justify-start">
                                                    <span className="font-medium text-[var(--text)] truncate text-sm">
                                                        {entry.firstName} {entry.lastName}
                                                    </span>
                                                    {isMe && <span className="ml-3 px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30">YOU</span>}
                                                </div>
                                                <div className="hidden sm:block col-span-3 text-right font-bold text-[var(--accent)]">
                                                    {entry.totalPoints.toLocaleString()}
                                                </div>
                                                <div className="hidden sm:flex col-span-2 justify-center">
                                                    {renderTrendIcon(entry.trend)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="glass-card p-12 text-center flex flex-col items-center">
                        <Trophy className="w-16 h-16 text-[var(--text-muted)] mb-4 opacity-50" />
                        <h3 className="text-xl font-bold text-[var(--text)] mb-2">No {timeframe.toLowerCase()} rankings yet</h3>
                        <p className="text-[var(--text-muted)]">Be the first to log a session and claim rank #1 in this timeframe!</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Leaderboard;
