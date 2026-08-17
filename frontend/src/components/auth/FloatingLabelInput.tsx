import React, { useState } from 'react';

interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({ label, className = '', id, value, ...props }) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value !== undefined && value !== null && String(value).length > 0;
    const isActive = isFocused || hasValue;
    const inputId = id || `floating-input-${label.replace(/\s+/g, '-').toLowerCase()}`;

    return (
        <div className="relative w-full">
            <input
                id={inputId}
                value={value}
                onFocus={(e) => {
                    setIsFocused(true);
                    props.onFocus?.(e);
                }}
                onBlur={(e) => {
                    setIsFocused(false);
                    props.onBlur?.(e);
                }}
                className={`
    glass-input px-4 pt-6 pb-2 appearance-none
    transition-colors duration-200 peer ${className}
`}
                placeholder=" "
                {...props}
            />
            <label
                htmlFor={inputId}
                className={`
                    absolute left-4 cursor-text transition-all duration-200
                    ${isActive 
                        ? 'top-2 text-xs text-[var(--accent)] font-medium' 
                        : 'top-4 text-base text-[var(--text-muted)]'
                    }
                `}
            >
                {label}
            </label>
        </div>
    );
};

export default FloatingLabelInput;
