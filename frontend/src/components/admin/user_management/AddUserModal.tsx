import { createPortal } from "react-dom";
import { useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";

interface Props {
    onClose: () => void;
    onSubmit: (data: AddUserForm) => void;
}

export interface AddUserForm {
    email: string;
    password: string;
    role: "Admin" | "User";
    status: "Active" | "Inactive";
    authProvider: "LOCAL" | "GOOGLE" | "FACEBOOK";
}

export default function AddUserModal({ onClose, onSubmit }: Props) {
    const [form, setForm] = useState<AddUserForm>({
        email: "",
        password: "",
        role: "User",
        status: "Active",
        authProvider: "LOCAL",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<Partial<AddUserForm>>({});

    function validate(): boolean {
        const e: Partial<AddUserForm> = {};
        if (!form.email.trim()) e.email = "Vui lòng nhập email";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email không hợp lệ";
        if (!form.password.trim()) e.password = "Vui lòng nhập mật khẩu";
        else if (form.password.length < 6) e.password = "Mật khẩu tối thiểu 6 ký tự";
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (validate()) onSubmit(form);
    }

    const inputClass = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all";
    const selectClass = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all cursor-pointer";

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between px-8 pt-7 pb-5">
                    <div>
                        <h2 className="text-xl font-extrabold text-gray-900">Thêm người dùng mới</h2>
                        <p className="text-sm text-gray-400 mt-1">Thêm thành viên mới vào hệ thống.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
                    {/* Email */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Địa chỉ Email
                        </label>
                        <input
                            type="text"
                            placeholder="ten@example.com"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className={inputClass}
                        />
                        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Mật khẩu
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className={inputClass + " pr-10"}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                    </div>

                    {/* Role + Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Vai trò</label>
                            <select
                                value={form.role}
                                onChange={(e) => setForm({ ...form, role: e.target.value as "Admin" | "User" })}
                                className={selectClass}
                            >
                                <option value="User">User</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Trạng thái</label>
                            <select
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value as "Active" | "Inactive" })}
                                className={selectClass}
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    {/* Auth Provider */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Nhà cung cấp xác thực
                        </label>
                        <select
                            value={form.authProvider}
                            onChange={(e) => setForm({ ...form, authProvider: e.target.value as "LOCAL" | "GOOGLE" | "FACEBOOK" })}
                            className={selectClass}
                        >
                            <option value="LOCAL">LOCAL</option>
                            <option value="GOOGLE">GOOGLE</option>
                            <option value="FACEBOOK">FACEBOOK</option>
                        </select>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-orange-500/30"
                        >
                            Thêm người dùng
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
