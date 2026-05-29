import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Upload, X } from "lucide-react";
import { badgeManagementService } from "@/services/admin/badgeManagementService";
import type { AdminBadge, BadgeUpsertPayload } from "@/services/admin/badgeManagementService";

interface Props {
    mode: "add" | "edit";
    badge?: AdminBadge | null;
    onClose: () => void;
    onSubmit: (payload: BadgeUpsertPayload) => Promise<void> | void;
}

type FormState = {
    badgeName: string;
    description: string;
    requiredKn: string;
    status: "active" | "inactive";
};

export default function AddEditBadgeModal({ mode, badge, onClose, onSubmit }: Props) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [form, setForm] = useState<FormState>({
        badgeName: "",
        description: "",
        requiredKn: "",
        status: "active",
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [errors, setErrors] = useState<Partial<Record<keyof FormState | "file", string>>>({});
    const [uploadingImage, setUploadingImage] = useState(false);
    const isEdit = mode === "edit";

    useEffect(() => {
        setForm({
            badgeName: badge?.badgeName || "",
            description: badge?.description || "",
            requiredKn: badge?.requiredKn ? String(badge.requiredKn) : "",
            status: badge?.status || "active",
        });
        setSelectedFile(null);
        setErrors({});
        setPreviewUrl(badge?.iconUrl || "");
    }, [badge, mode]);

    useEffect(() => {
        if (!selectedFile) {
            setPreviewUrl(badge?.iconUrl || "");
            return;
        }

        const objectUrl = URL.createObjectURL(selectedFile);
        setPreviewUrl(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [selectedFile, badge?.iconUrl]);

    const previewLabel = useMemo(() => {
        if (selectedFile) {
            return selectedFile.name;
        }
        return badge?.iconUrl ? "Ảnh hiện tại" : "Chưa có ảnh";
    }, [badge?.iconUrl, selectedFile]);

    function validate() {
        const nextErrors: Partial<Record<keyof FormState | "file", string>> = {};

        if (!form.badgeName.trim()) nextErrors.badgeName = "Vui lòng nhập title badge";
        if (!form.requiredKn.trim()) nextErrors.requiredKn = "Vui lòng nhập số KN";
        else if (Number.isNaN(Number(form.requiredKn)) || Number(form.requiredKn) <= 0) nextErrors.requiredKn = "KN phải lớn hơn 0";
        if (!isEdit && !selectedFile) nextErrors.file = "Vui lòng chọn hình badge";

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        if (!validate()) return;

        let iconUrl = badge?.iconUrl || "";
        if (selectedFile) {
            try {
                setUploadingImage(true);
                iconUrl = await badgeManagementService.uploadBadgeImage(selectedFile);
            } catch (error) {
                console.error("Upload badge image failed", error);
                setErrors((current) => ({ ...current, file: "Không thể tải ảnh badge lên cloud" }));
                return;
            } finally {
                setUploadingImage(false);
            }
        }

        await onSubmit({
            badgeName: form.badgeName.trim(),
            description: form.description.trim(),
            requiredKn: Number(form.requiredKn),
            status: form.status,
            iconUrl: iconUrl || undefined,
        });
    }

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
                <div className="flex items-start justify-between px-7 pt-6 pb-4">
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-900">
                            {isEdit ? "Sửa badge" : "Thêm badge mới"}
                        </h2>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5 px-7 pb-7">
                    <div className="grid gap-5 md:grid-cols-[220px_1fr]">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Hình badge</label>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="group flex w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center transition hover:border-orange-300 hover:bg-orange-50/40"
                            >
                                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Badge preview" className="h-full w-full object-cover" />
                                    ) : (
                                        <ImagePlus className="h-10 w-10 text-slate-300 transition group-hover:text-orange-400" />
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-800">Chọn ảnh để upload</div>
                                    <div className="mt-1 text-xs text-slate-500">PNG, JPG, WEBP - tối đa 2MB</div>
                                </div>
                                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                                    <Upload className="h-3.5 w-3.5" />
                                    {previewLabel}
                                </span>
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                                onChange={(event) => {
                                    const file = event.target.files?.[0] ?? null;
                                    setSelectedFile(file);
                                    setErrors((current) => ({ ...current, file: undefined }));
                                }}
                            />
                            {errors.file && <p className="mt-2 text-xs text-red-500">{errors.file}</p>}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Tên badge</label>
                                <input
                                    value={form.badgeName}
                                    onChange={(event) => setForm({ ...form, badgeName: event.target.value })}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-300 focus:bg-white"
                                    placeholder="Ví dụ: Bước Chân Đầu Tiên"
                                />
                                {errors.badgeName && <p className="mt-1 text-xs text-red-500">{errors.badgeName}</p>}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Mô tả</label>
                                <textarea
                                    value={form.description}
                                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                                    className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-300 focus:bg-white"
                                    placeholder="Nhập mô tả badge"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Số KN cần đạt</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={form.requiredKn}
                                    onChange={(event) => setForm({ ...form, requiredKn: event.target.value })}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-300 focus:bg-white"
                                    placeholder="30"
                                />
                                {errors.requiredKn && <p className="mt-1 text-xs text-red-500">{errors.requiredKn}</p>}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Trạng thái</label>
                                <select
                                    value={form.status}
                                    onChange={(event) => setForm({ ...form, status: event.target.value as FormState["status"] })}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-300 focus:bg-white"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">
                            Hủy
                        </button>
                        <button type="submit" disabled={uploadingImage} className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">
                            {uploadingImage ? "Đang tải ảnh..." : isEdit ? "Lưu thay đổi" : "Thêm badge"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}