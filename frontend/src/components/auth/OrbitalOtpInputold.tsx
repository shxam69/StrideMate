import React, { useState, useEffect, useRef } from 'react';

interface OrbitalOtpInputProps {
    value: string;
    onChange: (value: string) => void;
    onComplete: (value: string) => Promise<boolean>;
}

type Phase = 'entering' | 'curling' | 'orbiting' | 'verified' | 'error';

const OrbitalOtpInput: React.FC<OrbitalOtpInputProps> = ({ value, onChange, onComplete }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const hubRef = useRef<HTMLSpanElement>(null);
    const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [phase, setPhase] = useState<Phase>('entering');

    useEffect(() => {
        // Auto-focus the input when the component mounts
        const timer = setTimeout(() => {
            if (phase === 'entering') {
                inputRef.current?.focus();
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [phase]);

    useEffect(() => {
        if (value.length === 4 && phase === 'entering') {
            runAnimationSequence();
        }
    }, [value, phase]);

    const runAnimationSequence = async () => {
        if (!containerRef.current || !hubRef.current) return;
        
        // 1. Curl into orbit
        setPhase('curling');
        await new Promise(r => setTimeout(r, 700)); // 600ms CSS + 100ms delay

        // 2. Trigger Orbit Animation
        setPhase('orbiting');
        
        // Concurrently fire the verification API
        const apiPromise = onComplete(value);
        
        const hubRect = hubRef.current.getBoundingClientRect();
        const hubCenterX = hubRect.left + hubRect.width / 2;
        const hubCenterY = hubRect.top + hubRect.height / 2;

        const animations = slotRefs.current.map((slot) => {
            if (!slot) return null;
            
            const slotRect = slot.getBoundingClientRect();
            const slotCenterX = slotRect.left + slotRect.width / 2;
            const slotCenterY = slotRect.top + slotRect.height / 2;
            
            // Calculate dx and dy as the delta between each slot's center and the hub center
            const dx = slotCenterX - hubCenterX;
            const dy = slotCenterY - hubCenterY;
            
            const slotWidth = 52;
            const slotHeight = 52;
            
            slot.style.transformOrigin = `${dx + slotWidth / 2}px ${dy + slotHeight / 2}px`;
            
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

        // Wait for orbit animation to finish
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
            }, 600);
            return;
        }

        // To allow CSS '.success' class to take over and animate to 0,0,
        // we must cancel the forwards fill of the Web Animation so CSS applies.
        // We do this instantly before React renders the success class.
        slotRefs.current.forEach(slot => {
            if (slot) {
                const anims = slot.getAnimations();
                anims.forEach(a => a.cancel());
            }
        });
        
        // Success collapse
        setPhase('verified');
    };

    const handleContainerClick = () => {
        if (phase === 'entering' || phase === 'error') {
            inputRef.current?.focus();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (phase !== 'entering' && phase !== 'error') return;
        const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
        onChange(val);
    };

    const dataState = phase === 'entering' || phase === 'error' ? 'line' : 'orbit';

    return (
        <div className="relative flex flex-col items-center justify-center w-full">
            <div 
                ref={containerRef}
                className={`relative w-[200px] h-[200px] flex items-center justify-center cursor-text ${phase === 'error' ? 'animate-shake' : ''}`}
                style={{ zIndex: 1 }}
                onClick={handleContainerClick}
            >
                <input
                    ref={inputRef}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={4}
                    value={phase === 'entering' || phase === 'error' ? value : ''}
                    onChange={handleChange}
                    className="absolute top-0 left-0 w-full h-full opacity-0 z-50 text-transparent bg-transparent border-none outline-none focus:outline-none focus:ring-0"
                    style={{ 
                        caretColor: 'transparent',
                        pointerEvents: (phase === 'entering' || phase === 'error') ? 'auto' : 'none'
                    }}
                />

                {/* SVG Dotted Path */}
                <svg 
                    className={`absolute top-0 left-0 w-full h-full pointer-events-none transition-colors duration-400 ease-out`} 
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
                        stroke={phase === 'verified' ? '#2ee6a8' : '#333842'} 
                        strokeWidth="1.5" 
                        strokeDasharray="3 6"
                        style={{ transition: 'stroke 0.4s ease' }}
                    />
                </svg>
                
                {/* Central Hub */}
                <span 
                    ref={hubRef}
                    className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-[#555] rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-300"
                    style={{ opacity: phase === 'verified' ? 0 : 1 }}
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
                    <div className="w-12 h-12 bg-[#2ee6a8] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(46,230,168,0.4)]">
                        <svg className="w-6 h-6 text-[#121214]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>

                {/* OTP Slots */}
                {[0, 1, 2, 3].map((index) => {
                    const digit = value[index] || '';
                    const isActive = value.length === index && (phase === 'entering' || phase === 'error');
                    
                    let borderColor = 'border-[#2a2d36]';
                    let shadow = '';
                    
                    if (phase === 'error') {
                        borderColor = 'border-[#ff4d6a]';
                    } else if (isActive) {
                        borderColor = 'border-[#dceaff]';
                        shadow = 'shadow-[0_0_12px_rgba(220,234,255,0.2)]';
                    }

                    return (
                        <div
                            key={index}
                            ref={el => { slotRefs.current[index] = el; }}
                            data-state={dataState}
                            data-index={index}
                            className={`slot ${phase === 'verified' ? 'success' : ''} absolute top-1/2 left-1/2 -mt-[26px] -ml-[26px] pointer-events-none flex items-center justify-center w-[52px] h-[52px] bg-[#181a20] rounded-xl text-[#f0f2f5] text-xl font-semibold border ${borderColor} ${shadow}`}
                            style={{
                                transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
                            }}
                        >
                            {digit}
                        </div>
                    );
                })}
            </div>
            
            <style>{`
                /* Horizontal Line Positions */
                .slot[data-state="line"][data-index="0"] { transform: translate(-90px, 0); }
                .slot[data-state="line"][data-index="1"] { transform: translate(-30px, 0); }
                .slot[data-state="line"][data-index="2"] { transform: translate(30px, 0); }
                .slot[data-state="line"][data-index="3"] { transform: translate(90px, 0); }

                /* Circular Orbit Positions */
                .slot[data-state="orbit"][data-index="0"] { transform: translate(0px, -66px); }
                .slot[data-state="orbit"][data-index="1"] { transform: translate(66px, 0px); }
                .slot[data-state="orbit"][data-index="2"] { transform: translate(0px, 66px); }
                .slot[data-state="orbit"][data-index="3"] { transform: translate(-66px, 0px); }

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
