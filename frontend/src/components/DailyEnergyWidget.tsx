import React from 'react';
import { BatteryCharging, HeartPulse } from 'lucide-react';

interface DailyEnergyWidgetProps {
    dailyEnergy: number; // 0 - 100
}

const DailyEnergyWidget: React.FC<DailyEnergyWidgetProps> = ({ dailyEnergy = 80 }) => {
    return (
        <div className="glass-card p-5 sm:p-6 flex items-center justify-between border-cyan-500/20 shadow-[0_0_25px_rgba(6,182,212,0.1)]">
            <div className="flex items-center space-x-3.5">
                <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                    <BatteryCharging className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                    <div className="flex items-center space-x-1.5">
                        <HeartPulse className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-xs uppercase font-bold text-cyan-300 tracking-wider">Daily Energy Bonus</span>
                    </div>
                    <p className="text-sm text-white/70 mt-0.5">
                        {dailyEnergy >= 90 ? 'Peak energy! Optimal training drive.' : 'Consistent effort keeps your momentum high!'}
                    </p>
                </div>
            </div>

            <div className="text-right flex-shrink-0 pl-3">
                <span className="text-2xl sm:text-3xl font-mono font-black text-cyan-300">{dailyEnergy}%</span>
            </div>
        </div>
    );
};

export default DailyEnergyWidget;
