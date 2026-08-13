import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    colorClass: string;
    bgClass?: string;
    trend?: {
        value: number;
        label: string;
        isPositive: boolean;
        isNeutral?: boolean;
    };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, colorClass, bgClass, trend }) => {
    return (
        <div className="glass-card p-5 md:p-6 flex flex-col justify-between h-full relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-3 rounded-2xl ${bgClass || 'bg-[var(--glass-bg)] border-[var(--glass-border)] border'} ${colorClass}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
            
            <div className="relative z-10">
                <h3 className="text-xs md:text-sm font-medium text-[var(--text-muted)] tracking-wide uppercase mb-1">{title}</h3>
                <div className="flex items-baseline space-x-2">
                    <p className="text-2xl md:text-3xl font-bold text-[var(--text)] tracking-tight">{value}</p>
                </div>
                
                {trend && (
                    <div className="mt-2 flex items-center text-sm">
                        <span className={`font-medium ${trend.isNeutral ? 'text-[var(--text-muted)]' : trend.isPositive ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                            {trend.isNeutral ? '—' : trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}{typeof trend.value === 'number' && trend.label.includes('%') ? '%' : ''}
                        </span>
                        <span className="text-[var(--text-muted)] ml-2">{trend.label.replace('%', '')}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatCard;
