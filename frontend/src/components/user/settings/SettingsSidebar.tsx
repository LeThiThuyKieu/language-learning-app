import { BookOpen, Bell, Palette, User, Flame } from "lucide-react";
import { SettingsTab } from "./types";

interface SettingsSidebarProps {
    activeTab: SettingsTab;
    onSelectTab: (tab: SettingsTab) => void;
}

const menuItems: Array<{ id: SettingsTab; label: string; icon: typeof User }> = [
    { id: "account", label: "Tài khoản", icon: User },
    { id: "learning", label: "Cài đặt học tập", icon: BookOpen },
    { id: "notifications", label: "Thông báo", icon: Bell },
    { id: "appearance", label: "Giao diện", icon: Palette },
];

export default function SettingsSidebar({ activeTab, onSelectTab }: SettingsSidebarProps) {
    return (
        <div className="rounded-[28px] shadow-lg border-0 bg-white p-4">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onSelectTab(item.id)}
                            className={`w-full mb-3 p-4 rounded-2xl flex items-center gap-3 transition-all ${
                                isActive ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-orange-50"
                            }`}
                        >
                            <Icon size={20} />
                            <span className="font-medium">{item.label}</span>
                        </button>
                    );
                })}

                <div className="mt-8 p-5 rounded-3xl bg-gradient-to-br from-orange-100 to-amber-100">
                    <Flame className="mb-3" />
                    <p className="font-semibold">Mục tiêu 7 ngày</p>
                    <p className="text-sm mt-2 text-slate-600">Giữ nhịp học đều đặn để không bị mất chuỗi.</p>
                </div>
        </div>
    );
}
