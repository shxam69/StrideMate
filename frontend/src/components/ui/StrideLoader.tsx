import React from 'react';

interface StrideLoaderProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    className?: string;
}

const StrideLoader: React.FC<StrideLoaderProps> = ({
    size = 'md',
    text,
    className = ''
}) => {
    const dimensions = {
        sm: { width: 36, height: 24, strokeWidth: 2.5 },
        md: { width: 64, height: 44, strokeWidth: 3 },
        lg: { width: 96, height: 64, strokeWidth: 4 }
    }[size];

    return (
        <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
            <style>{`
                .stride-loader-svg polyline {
                    fill: none;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                }
                .stride-loader-svg polyline.back {
                    stroke: var(--accent);
                    opacity: 0.2;
                }
                .stride-loader-svg polyline.front {
                    stroke: var(--accent);
                    stroke-dasharray: 48, 144;
                    stroke-dashoffset: 192;
                    animation: stride_dash 2s linear infinite;
                }
                .stride-loader-svg polyline.front2 {
                    stroke: #38bdf8;
                    stroke-dasharray: 48, 144;
                    stroke-dashoffset: 192;
                    animation: stride_dash 2s linear infinite;
                    animation-delay: 1s;
                }
                @keyframes stride_dash {
                    72.5% {
                        opacity: 0;
                    }
                    to {
                        stroke-dashoffset: 0;
                    }
                }
            `}</style>

            <div className="relative flex items-center justify-center">
                <svg
                    className="stride-loader-svg"
                    width={dimensions.width}
                    height={dimensions.height}
                    viewBox="0 0 64 48"
                >
                    <polyline
                        className="back"
                        strokeWidth={dimensions.strokeWidth}
                        points="2 24 16 24 22 8 32 40 40 18 46 28 50 24 62 24"
                    />
                    <polyline
                        className="front"
                        strokeWidth={dimensions.strokeWidth}
                        points="2 24 16 24 22 8 32 40 40 18 46 28 50 24 62 24"
                    />
                    <polyline
                        className="front2"
                        strokeWidth={dimensions.strokeWidth}
                        points="2 24 16 24 22 8 32 40 40 18 46 28 50 24 62 24"
                    />
                </svg>
            </div>

            {text && (
                <p className="text-xs sm:text-sm font-semibold text-[var(--text-muted)] animate-pulse tracking-wide text-center">
                    {text}
                </p>
            )}
        </div>
    );
};

export default StrideLoader;
