import React, { useState, useEffect, useRef } from 'react';

interface OrbitalOtpInputProps {
    value: string;
    onChange: (value: string) => void;
    onComplete: (value: string) => Promise<boolean>;
}

type Phase = 'entering' | 'curling' | 'orbiting' | 'collapsing' | 'verified' | 'error';

const OrbitalOtpInput: React.FC<OrbitalOtpInputProps> = ({ value, onChange, onComplete }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [phase, setPhase] = useState<Phase>('entering');

    const RADIUS = 70; // Radius of the orbit in px
    const HUB_SIZE = 16;
    
    // Base angles in degrees: Top, Right, Bottom, Left
    const anglesDeg = [-90, 0, 90, 180];

    // Horizontal layout spacing
    const SPACING = 65; 

    useEffect(() => {
        if (value.length === 4 && phase === 'entering') {
            runAnimationSequence();
        }
    }, [value, phase]);

    const runAnimationSequence = async () => {
        if (!containerRef.current) return;
        
        // 1. Curling (move to orbital starting positions)
        setPhase('curling');
        await new Promise(r => setTimeout(r, 400));
        
        // 2. Orbiting (rotate around hub)
        setPhase('orbiting');
        
        // Concurrently fire the verification API
        const apiPromise = onComplete(value);

        const WIND_UP_BRAKE = 'cubic-bezier(0.5, -0.3, 0.2, 1.2)';

        const animations = slotRefs.current.map((slot, i) => {
            if (!slot) return null;
            
            const baseAngle = anglesDeg[i];
            
            return slot.animate(
                [
                    { transform: `rotate(${baseAngle}deg) translate(${RADIUS}px)` },
                    { transform: `rotate(${baseAngle + 450}deg) translate(${RADIUS}px)` } // ~1.25 turns
                ],
                {
                    duration: 800,
                    easing: WIND_UP_BRAKE,
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
            // reset animation transforms
            slotRefs.current.forEach(slot => {
                if (slot) {
                    const anims = slot.getAnimations();
                    anims.forEach(a => a.cancel());
                }
            });
            setTimeout(() => {
                setPhase('entering');
                onChange('');
            }, 600);
            return;
        }

        // 3. Collapsing (move to center)
        setPhase('collapsing');
        
        slotRefs.current.forEach((slot, i) => {
            if (slot) {
                const baseAngle = anglesDeg[i];
                // Keep the 450deg rotation but collapse position to 0
                slot.animate([
                    { transform: `rotate(${baseAngle + 450}deg) translate(${RADIUS}px)`, opacity: 1 },
                    { transform: `rotate(${baseAngle + 450}deg) translate(0px)`, opacity: 0 }
                ], { duration: 300, fill: 'forwards', easing: 'ease-in' });
            }
        });
        
        await new Promise(r => setTimeout(r, 300));
        
        // 4. Verified (show checkmark)
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

    // Calculate position for a given slot based on phase
    const getSlotStyle = (index: number) => {
        let transform = '';
        let opacity = 1;

        if (phase === 'entering' || phase === 'error') {
            // Horizontal sequence
            const x = (index - 1.5) * SPACING;
            transform = `translate(${x}px, 0px)`;
        } else {
            // Orbital position (curling, orbiting, collapsing)
            const baseAngle = anglesDeg[index];
            transform = `rotate(${baseAngle}deg) translate(${RADIUS}px)`;
        }

        if (phase === 'verified') {
            opacity = 0;
        }

        return {
            transform,
            opacity,
            transition: phase === 'curling' ? 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
        };
    };

    return (
        <div className="relative flex flex-col items-center justify-center w-full" onClick={handleContainerClick}>
            <input
                ref={inputRef}
                type="tel"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={4}
                value={phase === 'entering' || phase === 'error' ? value : ''} // prevent native changes during animation
                onChange={handleChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-[0px]"
                style={{ zIndex: 10, display: (phase === 'entering' || phase === 'error') ? 'block' : 'none' }}
            />

            <div 
                ref={containerRef}
                className={`relative w-64 h-64 flex items-center justify-center ${phase === 'error' ? 'animate-shake' : ''}`}
                style={{ zIndex: 1 }}
            >
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 200">
                    <circle 
                        cx="100" 
                        cy="100" 
                        r={RADIUS}
                        fill="none" 
                        stroke="rgba(255, 255, 255, 0.15)" 
                        strokeWidth="1.5" 
                        strokeDasharray="2 8"
                        style={{
                            transition: 'opacity 0.4s',
                            opacity: (phase === 'entering' || phase === 'verified' || phase === 'error') ? 0 : 1
                        }} 
                    />
                    
                    {/* Central Hub */}
                    <circle 
                        cx="100" 
                        cy="100" 
                        r={phase === 'verified' ? HUB_SIZE : HUB_SIZE / 2}
                        fill={phase === 'verified' ? '#2ee6a8' : 'rgba(255, 255, 255, 0.1)'} 
                        stroke={phase === 'verified' ? '#2ee6a8' : 'rgba(255, 255, 255, 0.3)'} 
                        strokeWidth="1"
                        style={{
                            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            transformOrigin: '100px 100px',
                            transform: phase === 'verified' ? 'scale(1.5)' : 'scale(1)'
                        }}
                    />
                </svg>

                {/* Checkmark icon for verified state */}
                <div 
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{
                        opacity: phase === 'verified' ? 1 : 0,
                        transition: 'opacity 0.3s 0.1s',
                        zIndex: 20
                    }}
                >
                    <svg className="w-6 h-6 text-[#121214]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                {/* OTP Slots */}
                {anglesDeg.map((_, index) => {
                    const digit = value[index] || '';
                    const isActive = value.length === index && (phase === 'entering' || phase === 'error');
                    const isFilled = value.length > index;
                    
                    let borderColor = 'border-white/10';
                    let bgColor = 'bg-white/5';
                    let textColor = 'text-slate-400';

                    if (phase === 'error') {
                        borderColor = 'border-[#ff4d6a]/50';
                        bgColor = 'bg-[#ff4d6a]/10';
                        textColor = 'text-[#ff4d6a]';
                    } else if (isActive) {
                        borderColor = 'border-indigo-400';
                        bgColor = 'bg-indigo-500/20';
                    } else if (isFilled) {
                        borderColor = 'border-white/30';
                        bgColor = 'bg-white/10';
                        textColor = 'text-white';
                    }

                    return (
                        <div
                            key={index}
                            ref={el => { slotRefs.current[index] = el; }}
                            className={`absolute flex items-center justify-center w-14 h-14 rounded-2xl border text-xl font-medium transition-colors duration-300 backdrop-blur-md
                                ${borderColor} ${bgColor} ${textColor}
                                ${isActive ? 'shadow-[0_0_15px_rgba(99,102,241,0.3)]' : ''}
                            `}
                            style={getSlotStyle(index)}
                        >
                            <span 
                                style={{ 
                                    // Counter-rotate the text so it stays upright if needed,
                                    // but we follow the requested rotate implementation.
                                    // We will leave it as is, which naturally rotates the digit.
                                }}
                            >
                                {digit}
                            </span>
                        </div>
                    );
                })}
            </div>
            
            <style>{`
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
