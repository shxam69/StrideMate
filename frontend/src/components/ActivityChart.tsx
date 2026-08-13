import React from 'react';
import type { VolumeOverTime, SportBreakdown } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface ActivityChartProps {
    volume: VolumeOverTime[];
    breakdown: SportBreakdown[];
}

// Colors can be fixed per-sport or read from Tailwind, but Recharts needs hex/rgb strings. 
// We'll use our theme colors via CSS variables or fixed palette that looks good on both.
const COLORS = ['#8B5CF6', '#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#F43F5E'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[var(--surface-elevated)] backdrop-blur-xl p-4 rounded-xl border border-[var(--border)] shadow-xl">
                <p className="text-[var(--text-muted)] text-sm mb-1">{label}</p>
                <p className="text-[var(--text)] font-bold text-lg">
                    {payload[0].value} <span className="text-sm font-medium text-[var(--accent)]">pts</span>
                </p>
            </div>
        );
    }
    return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[var(--surface-elevated)] backdrop-blur-xl p-3 rounded-xl border border-[var(--border)] shadow-xl">
                <p className="text-[var(--text)] font-semibold">
                    {payload[0].name.replace('_', ' ')}
                </p>
                <p className="text-[var(--text-muted)] text-sm">
                    {payload[0].value} pts
                </p>
            </div>
        );
    }
    return null;
};

const ActivityChart: React.FC<ActivityChartProps> = ({ volume, breakdown }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)] gap-6 md:gap-8 h-full">
            <div className="glass-card p-4 md:p-6 flex flex-col h-[300px] md:h-[400px]">
                <h3 className="text-xs md:text-sm font-medium text-[var(--text-muted)] tracking-wide uppercase mb-4 md:mb-6">Points Over Time</h3>
                <div className="flex-1 w-full relative -ml-2 md:ml-0">
                    {volume.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={volume} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.5}/>
                                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis 
                                    dataKey="date" 
                                    tick={{ fill: 'var(--text-muted)', fontSize: 12 }} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    dy={10}
                                />
                                <YAxis 
                                    tick={{ fill: 'var(--text-muted)', fontSize: 12 }} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    dx={-10}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                                <Area 
                                    type="monotone" 
                                    dataKey="points" 
                                    stroke="#8B5CF6" 
                                    strokeWidth={3} 
                                    fillOpacity={1} 
                                    fill="url(#colorPoints)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">No activity data yet</div>
                    )}
                </div>
            </div>

            <div className="glass-card p-4 md:p-6 flex flex-col h-[300px] md:h-[400px]">
                <h3 className="text-xs md:text-sm font-medium text-[var(--text-muted)] tracking-wide uppercase mb-2">Sport Preference</h3>
                <div className="flex-1 w-full flex justify-center relative">
                    {breakdown.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={breakdown}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="points"
                                    nameKey="sport"
                                    stroke="none"
                                >
                                    {breakdown.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomPieTooltip />} />
                                <Legend 
                                    verticalAlign="bottom" 
                                    height={36} 
                                    iconType="circle"
                                    formatter={(value) => <span className="text-[var(--text-muted)] text-xs md:text-sm capitalize">{value.replace('_', ' ').toLowerCase()}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">No sport data yet</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivityChart;
