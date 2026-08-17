import React, { useState } from 'react';

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    value: string;
    onChange: (val: string) => void;
    label?: string;
}

const COUNTRY_CODES = [
    { code: '+91', label: 'IN (+91)' },
    { code: '+1', label: 'US (+1)' },
    { code: '+44', label: 'UK (+44)' },
];

const PhoneInput: React.FC<PhoneInputProps> = ({ label = "Phone Number", value, onChange, id, className = '', ...props }) => {
    const inputId = id || "phone-input";
    
    // Attempt to parse out existing country code to set default
    let defaultCode = '+91';
    let defaultNumber = value || '';
    
    for (const c of COUNTRY_CODES) {
        if (value && value.startsWith(c.code)) {
            defaultCode = c.code;
            defaultNumber = value.slice(c.code.length);
            break;
        }
    }

    const [countryCode, setCountryCode] = useState(defaultCode);
    const [phoneNumber, setPhoneNumber] = useState(defaultNumber);
    const [isFocused, setIsFocused] = useState(false);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only allow numbers and basic formatting characters if needed, but 'tel' handles standard input
        const raw = e.target.value;
        setPhoneNumber(raw);
        onChange(countryCode + raw);
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCode = e.target.value;
        setCountryCode(newCode);
        onChange(newCode + phoneNumber);
    };

    return (
        <div className="space-y-1.5 w-full">
            <label htmlFor={inputId} className="block text-sm font-medium text-[var(--text-muted)]">
                {label}
            </label>
            <div 
                className={`flex h-12 bg-[var(--bg)]/50 border-[1.5px] rounded-xl overflow-hidden transition-all duration-200 ${
                    isFocused ? 'border-[var(--accent)] ring-0' : 'border-[var(--border)]'
                }`}
            >
                <select
                    value={countryCode}
                    onChange={handleCodeChange}
                    className="h-full bg-transparent border-none text-[var(--text)] pl-3 pr-8 focus:ring-0 cursor-pointer border-r border-[var(--border)] outline-none text-sm font-medium"
                    aria-label="Country Code"
                >
                    {COUNTRY_CODES.map(c => (
                        <option key={c.code} value={c.code} className="bg-[var(--bg)] text-[var(--text)]">
                            {c.label}
                        </option>
                    ))}
                </select>
                <input
                    id={inputId}
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={`flex-1 h-full pl-3 pr-4 bg-transparent border-none text-[var(--text)] focus:ring-0 outline-none ${className}`}
                    {...props}
                />
            </div>
        </div>
    );
};

export default PhoneInput;
