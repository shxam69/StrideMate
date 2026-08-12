import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    colorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, colorClass }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-center space-x-4 border border-slate-100 transition hover:shadow-md">
            <div className={`p-4 rounded-full ${colorClass}`}>
                <Icon className="w-8 h-8 text-white" />
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</p>
                <p className="text-3xl font-bold text-slate-800">{value}</p>
            </div>
        </div>
    );
};

export default StatCard;
