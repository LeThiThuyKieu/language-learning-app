import { ReactNode } from "react";

interface SettingRowProps {
    title: string;
    description?: string;
    right?: ReactNode;
    children?: ReactNode;
}

export default function SettingRow({ title, description, right, children }: SettingRowProps) {
    return (
        <div className="py-4 border-b last:border-b-0 border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h4 className="font-semibold text-slate-900">{title}</h4>
                    {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
                </div>
                {right && <div className="shrink-0">{right}</div>}
            </div>
            {children && <div className="mt-3">{children}</div>}
        </div>
    );
}
