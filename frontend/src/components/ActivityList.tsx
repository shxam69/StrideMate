import React from 'react';
import type { ActivityHistory } from '../types';
import { Activity, Bike, Droplets, Dumbbell, Footprints, Flame } from 'lucide-react';

const sportIcons: Record<string, React.ReactNode> = {
    RUNNING: <Flame className="w-5 h-5 text-red-500" />,
    WALKING: <Footprints className="w-5 h-5 text-green-500" />,
    CYCLING: <Bike className="w-5 h-5 text-blue-500" />,
    SWIMMING: <Droplets className="w-5 h-5 text-cyan-500" />,
    GYM: <Dumbbell className="w-5 h-5 text-purple-500" />,
    DAILY_STEPS: <Activity className="w-5 h-5 text-orange-500" />
};

interface ActivityListProps {
    activities: ActivityHistory[];
}

const ActivityList: React.FC<ActivityListProps> = ({ activities }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-800">Recent Activities</h3>
            </div>
            <ul className="divide-y divide-slate-100">
                {activities.length > 0 ? activities.map(act => (
                    <li key={act.activityId} className="px-6 py-4 hover:bg-slate-50 transition">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-slate-100 rounded-full">
                                    {sportIcons[act.sport] || <Activity className="w-5 h-5 text-slate-500" />}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">{act.sport.replace('_', ' ')}</p>
                                    <p className="text-xs text-slate-500">{new Date(act.recordedAt).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-indigo-600">+{act.points} pts</p>
                                <p className="text-xs text-slate-500">
                                    {act.distanceKm && `${act.distanceKm} km`}
                                    {act.durationMinutes !== undefined && act.durationMinutes !== null && `${act.durationMinutes}m ${act.durationSeconds || 0}s`}
                                    {act.steps && `${act.steps} steps`}
                                </p>
                            </div>
                        </div>
                    </li>
                )) : (
                    <li className="px-6 py-8 text-center text-slate-400">No recent activities found.</li>
                )}
            </ul>
        </div>
    );
};

export default ActivityList;
