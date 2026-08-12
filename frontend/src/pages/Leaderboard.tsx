import React, { useEffect, useState } from 'react';
import type { LeaderboardEntry } from '../types';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { Trophy, TrendingUp, TrendingDown, Minus, Circle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Leaderboard: React.FC = () => {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        api.get('/leaderboard')
            .then(res => setEntries(res.data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="min-h-screen bg-slate-50 flex justify-center items-center">Loading leaderboard...</div>;
    }

    const renderTrendIcon = (trend: string) => {
        switch (trend) {
            case 'UP': return <TrendingUp className="w-5 h-5 text-emerald-500" />;
            case 'DOWN': return <TrendingDown className="w-5 h-5 text-red-500" />;
            case 'FLAT': return <Minus className="w-5 h-5 text-slate-400" />;
            default: return <Circle className="w-5 h-5 text-slate-200" />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center space-x-4 mb-8">
                    <div className="p-3 bg-indigo-100 rounded-full">
                        <Trophy className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Global Leaderboard</h1>
                        <p className="text-slate-500 mt-1">See how you stack up against the competition.</p>
                    </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rank</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Athlete</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total Points</th>
                                <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">24h Trend</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {entries.map((entry) => {
                                const isMe = user?.id === entry.userId;
                                return (
                                    <tr key={entry.userId} className={`${isMe ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : 'hover:bg-slate-50'} transition`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {entry.rank === 1 && <span className="text-2xl mr-2">🥇</span>}
                                                {entry.rank === 2 && <span className="text-2xl mr-2">🥈</span>}
                                                {entry.rank === 3 && <span className="text-2xl mr-2">🥉</span>}
                                                <span className={`text-sm font-bold ${entry.rank <= 3 ? 'text-slate-900' : 'text-slate-500'}`}>
                                                    #{entry.rank}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-900">
                                                {entry.firstName} {entry.lastName} {isMe && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">You</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-indigo-600">{entry.totalPoints.toLocaleString()} pts</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex justify-center">
                                                {renderTrendIcon(entry.trend)}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {entries.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                                        No activities logged yet. Be the first!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default Leaderboard;
