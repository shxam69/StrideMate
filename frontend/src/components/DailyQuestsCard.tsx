import React from 'react';
import type { DailyQuest } from '../types';
import { Target, CheckCircle2, Zap } from 'lucide-react';

interface DailyQuestsCardProps {
    quests: DailyQuest[];
}

const DailyQuestsCard: React.FC<DailyQuestsCardProps> = ({ quests }) => {
    return (
        <div className="glass-card p-5 sm:p-6 space-y-4 border-indigo-500/20 shadow-[0_0_25px_rgba(99,102,241,0.1)]">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                    <div className="p-2.5 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)]">
                        <Target className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white">Daily Fitness Quests</h3>
                        <p className="text-[11px] text-white/50">Complete missions to earn bonus XP</p>
                    </div>
                </div>

                <span className="text-xs font-mono font-bold text-white/60">
                    {quests.filter(q => q.completed).length}/{quests.length} Completed
                </span>
            </div>

            <div className="space-y-3 pt-1">
                {quests.map((quest) => {
                    const percent = Math.min(100, Math.round((quest.currentProgress / Math.max(1, quest.targetValue)) * 100));

                    return (
                        <div
                            key={quest.id}
                            className={`p-3.5 rounded-2xl border transition-all ${
                                quest.completed
                                    ? 'bg-emerald-500/10 border-emerald-500/30'
                                    : 'bg-white/5 border-white/10 hover:border-white/20'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center space-x-2.5">
                                    {quest.completed ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                    ) : (
                                        <div className="w-4 h-4 rounded-full border-2 border-white/30 flex-shrink-0" />
                                    )}
                                    <div>
                                        <p className={`text-xs font-bold ${quest.completed ? 'text-emerald-300' : 'text-white'}`}>
                                            {quest.title}
                                        </p>
                                        <p className="text-[11px] text-white/50">{quest.description}</p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-1 text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                    <Zap className="w-3 h-3 fill-amber-400" />
                                    <span>+{quest.rewardXp} XP</span>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-mono text-white/50">
                                    <span>Progress</span>
                                    <span>{quest.currentProgress} / {quest.targetValue} ({percent}%)</span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                                    <div
                                        style={{ width: `${percent}%` }}
                                        className={`h-full rounded-full transition-all duration-500 ${
                                            quest.completed
                                                ? 'bg-emerald-400'
                                                : 'bg-[var(--accent)]'
                                        }`}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DailyQuestsCard;
