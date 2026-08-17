import React from 'react';
import { Mail } from 'lucide-react';

interface EmailInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

const EmailInput: React.FC<EmailInputProps> = ({ label = "Email address", className = '', id, ...props }) => {
    const inputId = id || "email-input";

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
                    type="email"
                    className={`
                        block w-full h-12 pl-4 pr-12 text-[var(--text)] bg-[var(--bg)]/50 
                        border-[1.5px] border-[var(--border)] rounded-xl
                        focus:outline-none focus:ring-0 focus:border-[var(--accent)] 
                        transition-all duration-200 ${className}
                    `}
                    {...props}
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors duration-200">
                    <Mail className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
};

export default EmailInput;
