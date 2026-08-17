import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({ label = "Password", className = '', id, ...props }) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || `password-input-${label.replace(/\s+/g, '-').toLowerCase()}`;

    return (
        <div className="space-y-1.5 w-full">
            {label && (
                <label htmlFor={inputId} className="block text-sm font-medium text-[var(--text-muted)]">
                    {label}
                </label>
            )}
            <div className="relative group">
                <input
                    id={inputId}
                    type={showPassword ? "text" : "password"}
                    className={`
                        glass-input h-12 pl-4 pr-12
                        ${className}
                    `}
                    {...props}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-r-xl"
                    aria-label={showPassword ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
                >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
            </div>
        </div>
    );
};

export default PasswordInput;
