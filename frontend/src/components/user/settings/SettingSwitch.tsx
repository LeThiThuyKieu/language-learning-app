import { useId } from "react";

interface SettingSwitchProps {
    checked: boolean;
    onChange: (value: boolean) => void;
    disabled?: boolean;
    ariaLabel?: string;
}

export default function SettingSwitch({ checked, onChange, disabled = false, ariaLabel }: SettingSwitchProps) {
    const inputId = useId();

    return (
        <label htmlFor={inputId} className={`relative inline-flex items-center ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
            <input
                id={inputId}
                type="checkbox"
                className="sr-only peer"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                disabled={disabled}
                aria-label={ariaLabel}
            />
            <span className="w-12 h-7 rounded-full bg-slate-300 transition-colors peer-checked:bg-primary-700 peer-disabled:opacity-60" />
            <span className="absolute left-1 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
        </label>
    );
}
