import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import {
    examManagementService,
    type AdminExamTestDto,
} from "@/services/admin/examManagementService";
import { getErrorMessage } from "@/utils/errorMessage";

interface Props {
    mode: "create" | "edit";
    test?: AdminExamTestDto;
    onClose: () => void;
    onSaved: (test: AdminExamTestDto) => void;
}

const CEFR_LEVELS = ["A2", "B1", "B2", "C1", "C2"];

export default function ExamTestFormModal({ mode, test, onClose, onSaved }: Props) {
    const isEdit = mode === "edit";

    const [cefrLevel, setCefrLevel] = useState(test?.cefrLevel ?? "A2");
    const [testNumber, setTestNumber] = useState(test?.testNumber?.toString() ?? "1");
    const [title, setTitle] = useState(test?.title ?? "");
    const [description, setDescription] = useState(test?.description ?? "");
    const [isActive, setIsActive] = useState(test?.isActive ?? true);
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const num = parseInt(testNumber, 10);
        if (!num || num < 1) {
            toast.error("Test number phải là số nguyên dương");
            return;
        }
        if (!title.trim()) {
            toast.error("Title không được để trống");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                cefrLevel,
                testNumber: num,
                title: title.trim(),
                description: description.trim() || undefined,
                isActive,
            };

            const saved = isEdit
                ? await examManagementService.updateTest(test!.id, payload)
                : await examManagementService.createTest(payload);

            onSaved(saved);
        } catch (err: unknown) {
            toast.error(
                getErrorMessage(err, isEdit ? "Không thể cập nhật bài thi" : "Không thể tạo bài thi")
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-800">
                        {isEdit ? "Chỉnh sửa bài thi" : "Thêm bài thi mới"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    {/* CEFR Level */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Cấp độ CEFR <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                            {CEFR_LEVELS.map(l => (
                                <button
                                    key={l}
                                    type="button"
                                    onClick={() => setCefrLevel(l)}
                                    className={[
                                        "flex-1 py-2 rounded-xl text-sm font-medium transition-colors",
                                        cefrLevel === l
                                            ? "bg-orange-500 text-white shadow-sm"
                                            : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                                    ].join(" ")}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Test Number */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Test Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            min={1}
                            value={testNumber}
                            onChange={e => setTestNumber(e.target.value)}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                            placeholder="1"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                            Thứ tự bài thi trong cùng cấp độ. Ví dụ: B2 Test 1, B2 Test 2.
                        </p>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                            placeholder="Vd: A2 Test 1 — Cambridge Key"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Mô tả
                        </label>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                            placeholder="Mô tả ngắn về bài thi (không bắt buộc)"
                        />
                    </div>

                    {/* Active toggle */}
                    <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-xl">
                        <div>
                            <p className="text-sm font-medium text-slate-700">Hiển thị bài thi</p>
                            <p className="text-xs text-slate-400">
                                Bài thi ẩn sẽ không xuất hiện với người dùng
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsActive(v => !v)}
                            className={[
                                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                                isActive ? "bg-green-500" : "bg-slate-300",
                            ].join(" ")}
                        >
                            <span
                                className={[
                                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                    isActive ? "translate-x-5" : "translate-x-0",
                                ].join(" ")}
                            />
                        </button>
                    </div>

                    {!isEdit && (
                        <p className="text-xs text-slate-400 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2">
                            Sau khi tạo, hệ thống sẽ tự động tạo 3 papers (Listening, Reading & Writing, Speaking) với thời lượng mặc định theo cấp độ.
                        </p>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                        >
                            Huỷ
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            {saving && <Loader2 size={14} className="animate-spin" />}
                            {isEdit ? "Lưu thay đổi" : "Tạo bài thi"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
