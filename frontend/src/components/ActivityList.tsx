import React from 'react';
import type { ActivityHistory } from '../types';
import { Activity, Bike, Droplets, Dumbbell, Footprints, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';

const sportIcons: Record<string, React.ReactNode> = {
    RUNNING: <Flame className="w-5 h-5 text-[var(--danger)]" />,
    WALKING: <Footprints className="w-5 h-5 text-[var(--success)]" />,
    CYCLING: <Bike className="w-5 h-5 text-blue-500" />,
    SWIMMING: <Droplets className="w-5 h-5 text-cyan-500" />,
    GYM: <Dumbbell className="w-5 h-5 text-purple-500" />,
    DAILY_STEPS: <Activity className="w-5 h-5 text-amber-500" />
};

const sportColors: Record<string, string> = {
    RUNNING: 'bg-[var(--danger)]/10 border-[var(--danger)]/20',
    WALKING: 'bg-[var(--success)]/10 border-[var(--success)]/20',
    CYCLING: 'bg-blue-500/10 border-blue-500/20',
    SWIMMING: 'bg-cyan-500/10 border-cyan-500/20',
    GYM: 'bg-purple-500/10 border-purple-500/20',
    DAILY_STEPS: 'bg-amber-500/10 border-amber-500/20'
};

interface ActivityListProps {
    activities: ActivityHistory[];
}

const ActivityList: React.FC<ActivityListProps> = ({ activities }) => {
    return (
        <div className="glass-card flex flex-col h-full overflow-hidden">
            <div className="px-4 md:px-6 py-4 md:py-5 border-b border-[var(--border)] flex justify-between items-center">
                <h3 className="text-xs md:text-sm font-medium text-[var(--text-muted)] tracking-wide uppercase">Recent Activities</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <ul className="divide-y divide-[var(--border)]">
                    {activities.length > 0 ? activities.map(act => (
                        <li key={act.activityId} className="px-4 md:px-6 py-4 hover:bg-[var(--surface-elevated)] transition-colors duration-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 md:space-x-4 flex-1 overflow-hidden">
                                    <div className={`p-2.5 md:p-3 flex-shrink-0 rounded-2xl border ${sportColors[act.sport] || 'bg-[var(--surface)] border-[var(--border)]'}`}>
                                        {sportIcons[act.sport] || <Activity className="w-5 h-5 text-[var(--text-muted)]" />}
                                    </div>
                                    <div className="truncate">
                                        <p className="text-sm md:text-base font-semibold text-[var(--text)] capitalize truncate">{act.sport.replace('_', ' ').toLowerCase()}</p>
                                        <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                                            {new Date(act.recordedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right ml-4 flex-shrink-0">
                                    <p className="text-sm md:text-base font-bold text-[var(--accent)]">+{act.points} <span className="text-xs font-medium opacity-80">pts</span></p>
                                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                        {act.distanceKm && `${act.distanceKm} km`}
                                        {act.durationMinutes !== undefined && act.durationMinutes !== null && `${act.durationMinutes}m ${act.durationSeconds || 0}s`}
                                        {act.steps && `${act.steps} steps`}
                                    </p>
                                </div>
                            </div>
                        </li>
                    )) : (
                        <li className="px-4 md:px-6 py-12 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mb-4">
                                <Activity className="w-8 h-8 text-[var(--text-muted)]" />
                            </div>
                            <p className="text-[var(--text)] font-medium mb-1">No activities yet</p>
                            <p className="text-sm text-[var(--text-muted)] mb-6 max-w-[200px]">Get moving and start logging your fitness journey.</p>
                            <Link to="/add-activity" className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
                                Add your first activity &rarr;
                            </Link>
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default ActivityList;
