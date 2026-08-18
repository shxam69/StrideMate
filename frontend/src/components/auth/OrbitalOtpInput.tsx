import React, { useState, useEffect, useRef } from 'react';

interface OrbitalOtpInputProps {
    value: string;
    onChange: (value: string) => void;
    onComplete: (value: string) => Promise<boolean>;
    disabled?: boolean;
}

type Phase = 'entering' | 'curling' | 'orbiting' | 'verified' | 'error';

const OrbitalOtpInput: React.FC<OrbitalOtpInputProps> = ({ value, onChange, onComplete, disabled = false }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const hubRef = useRef<HTMLSpanElement>(null);
    const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [phase, setPhase] = useState<Phase>('entering');

    useEffect(() => {
        // Auto-focus input on mount or reset
        const timer = setTimeout(() => {
            if (phase === 'entering' && !disabled) {
                inputRef.current?.focus();
            }
        }, 200);
        return () => clearTimeout(timer);
    }, [phase, disabled]);

    useEffect(() => {
        if (value.length === 6 && phase === 'entering' && !disabled) {
            runAnimationSequence();
        }
    }, [value, phase, disabled]);

    const runAnimationSequence = async () => {
        if (!containerRef.current || !hubRef.current) return;

        // 1. Curl into orbit
        setPhase('curling');
        await new Promise(r => setTimeout(r, 600));

        // 2. Trigger Orbit Animation
        setPhase('orbiting');

        // Concurrently fire verification API
        const apiPromise = onComplete(value);

        const hubRect = hubRef.current.getBoundingClientRect();
        const hubCenterX = hubRect.left + hubRect.width / 2;
        const hubCenterY = hubRect.top + hubRect.height / 2;

        const animations = slotRefs.current.map((slot) => {
            if (!slot) return null;

            const slotRect = slot.getBoundingClientRect();
            const slotCenterX = slotRect.left + slotRect.width / 2;
            const slotCenterY = slotRect.top + slotRect.height / 2;

            const dx = slotCenterX - hubCenterX;
            const dy = slotCenterY - hubCenterY;

            slot.style.transformOrigin = '50% 50%';

            return slot.animate(
                [
                    { transform: `rotate(0deg) translate(${dx}px, ${dy}px)` },
                    { transform: `rotate(450deg) translate(${dx}px, ${dy}px)` }
                ],
                {
                    duration: 800,
                    easing: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
                    fill: 'forwards'
                }
            );
        });

        await Promise.all(animations.map(a => a?.finished));

        // Check verification result
        const success = await apiPromise;

        if (!success) {
            setPhase('error');
            setTimeout(() => {
                slotRefs.current.forEach(slot => {
                    if (slot) {
                        const anims = slot.getAnimations();
                        anims.forEach(a => a.cancel());
                    }
                });
                setPhase('entering');
                onChange('');
                inputRef.current?.focus();
            }, 600);
            return;
        }

        // Cancel fill on success so CSS transition applies
        slotRefs.current.forEach(slot => {
            if (slot) {
                const anims = slot.getAnimations();
                anims.forEach(a => a.cancel());
            }
        });

        setPhase('verified');
    };

    const handleFocusInput = () => {
        if ((phase === 'entering' || phase === 'error') && !disabled) {
            inputRef.current?.focus();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (phase !== 'entering' && phase !== 'error') return;
        const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
        onChange(val);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && value.length > 0) {
            onChange(value.slice(0, -1));
        }
    };

    const dataState = phase === 'entering' || phase === 'error' ? 'line' : 'orbit';

    return (
        <div 
            className="relative flex flex-col items-center justify-center w-full max-w-[360px] select-none"
            onClick={handleFocusInput}
            onTouchStart={handleFocusInput}
        >
            <div 
                ref={containerRef}
                className={`relative w-[280px] sm:w-[320px] h-[180px] flex items-center justify-center cursor-text ${phase === 'error' ? 'animate-shake' : ''}`}
                style={{ zIndex: 1 }}
            >
                {/* Full-width transparent input spanning entire container for reliable focus & keyboard */}
                <input
                    ref={inputRef}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    disabled={disabled || phase === 'curling' || phase === 'orbiting' || phase === 'verified'}
                    value={phase === 'entering' || phase === 'error' ? value : ''}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    className="absolute inset-0 w-full h-full opacity-0 z-50 text-transparent bg-transparent border-none outline-none focus:outline-none focus:ring-0 cursor-text"
                    style={{ 
                        caretColor: 'transparent',
                        pointerEvents: (phase === 'entering' || phase === 'error') ? 'auto' : 'none'
                    }}
                />

                {/* SVG Dotted Orbit Path */}
                <svg 
                    className="absolute top-0 left-0 w-full h-full pointer-events-none transition-colors duration-400 ease-out" 
                    viewBox="0 0 200 200"
                    style={{
                        opacity: phase === 'verified' ? 0 : 1
                    }}
                >
                    <circle 
                        className={`orbit-path ${phase === 'verified' ? 'success' : ''}`}
                        cx="100" 
                        cy="100" 
                        r="66"
                        fill="none" 
                        stroke={phase === 'verified' ? 'var(--success)' : 'var(--border)'} 
                        strokeWidth="1.5" 
                        strokeDasharray="3 6"
                        style={{ transition: 'stroke 0.4s ease' }}
                    />
                </svg>
                
                {/* Central Hub */}
                <span 
                    ref={hubRef}
                    className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-300"
                    style={{ opacity: phase === 'verified' ? 0 : 1, backgroundColor: 'var(--text-muted)' }}
                ></span>

                {/* Checkmark icon for verified state */}
                <div 
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
                    style={{
                        opacity: phase === 'verified' ? 1 : 0,
                        transition: 'opacity 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.3s',
                        transform: phase === 'verified' ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.5)',
                        zIndex: 20
                    }}
                >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-[0_0_20px_var(--success)]" style={{ backgroundColor: 'var(--success)' }}>
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>

                {/* OTP Slots */}
                {[0, 1, 2, 3, 4, 5].map((index) => {
                    const digit = value[index] || '';
                    const isActive = value.length === index && (phase === 'entering' || phase === 'error');
                    
                    let borderColor = 'border-white/15';
                    let shadow = '';
                    
                    if (phase === 'error') {
                        borderColor = 'border-[var(--danger)]';
                        shadow = 'shadow-[0_0_12px_rgba(244,63,94,0.3)]';
                    } else if (isActive) {
                        borderColor = 'border-[var(--accent)]';
                        shadow = 'shadow-[0_0_12px_var(--glow-blue)]';
                    } else if (digit) {
                        borderColor = 'border-[var(--accent)]/50';
                    }

                    return (
                        <div
                            key={index}
                            ref={el => { slotRefs.current[index] = el; }}
                            data-state={dataState}
                            data-index={index}
                            className={`slot ${phase === 'verified' ? 'success' : ''} absolute top-1/2 left-1/2 -mt-[22px] -ml-[22px] sm:-mt-[26px] sm:-ml-[26px] pointer-events-none flex items-center justify-center w-[44px] h-[44px] sm:w-[52px] sm:h-[52px] bg-[var(--surface-elevated)] rounded-xl text-[var(--text)] text-lg sm:text-xl font-bold border ${borderColor} ${shadow}`}
                            style={{
                                transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
                            }}
                        >
                            {digit}
                            {isActive && (
                                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-[var(--accent)] animate-pulse"></span>
                            )}
                        </div>
                    );
                })}
            </div>
            
            <style>{`
                /* Responsive Horizontal Line Positions */
                @media (max-width: 639px) {
                    .slot[data-state="line"][data-index="0"] { transform: translate(-115px, 0); }
                    .slot[data-state="line"][data-index="1"] { transform: translate(-69px, 0); }
                    .slot[data-state="line"][data-index="2"] { transform: translate(-23px, 0); }
                    .slot[data-state="line"][data-index="3"] { transform: translate(23px, 0); }
                    .slot[data-state="line"][data-index="4"] { transform: translate(69px, 0); }
                    .slot[data-state="line"][data-index="5"] { transform: translate(115px, 0); }
                }

                @media (min-width: 640px) {
                    .slot[data-state="line"][data-index="0"] { transform: translate(-130px, 0); }
                    .slot[data-state="line"][data-index="1"] { transform: translate(-78px, 0); }
                    .slot[data-state="line"][data-index="2"] { transform: translate(-26px, 0); }
                    .slot[data-state="line"][data-index="3"] { transform: translate(26px, 0); }
                    .slot[data-state="line"][data-index="4"] { transform: translate(78px, 0); }
                    .slot[data-state="line"][data-index="5"] { transform: translate(130px, 0); }
                }

                /* Circular Orbit Positions */
                .slot[data-state="orbit"][data-index="0"] { transform: translate(0px, -66px); }
                .slot[data-state="orbit"][data-index="1"] { transform: translate(57px, -33px); }
                .slot[data-state="orbit"][data-index="2"] { transform: translate(57px, 33px); }
                .slot[data-state="orbit"][data-index="3"] { transform: translate(0px, 66px); }
                .slot[data-state="orbit"][data-index="4"] { transform: translate(-57px, 33px); }
                .slot[data-state="orbit"][data-index="5"] { transform: translate(-57px, -33px); }

                /* Success Collapse */
                .slot.success {
                    transform: translate(0, 0) scale(0) !important;
                    opacity: 0;
                    transition: transform 0.5s cubic-bezier(0.6, -0.28, 0.735, 0.045), opacity 0.3s !important;
                }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20% { transform: translateX(-8px); }
                    40% { transform: translateX(8px); }
                    60% { transform: translateX(-8px); }
                    80% { transform: translateX(8px); }
                }
                .animate-shake {
                    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                }
            `}</style>
        </div>
    );
};

export default OrbitalOtpInput;
