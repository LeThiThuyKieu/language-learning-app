import { useRef, useState } from "react";
import { Upload, Link as LinkIcon, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { examManagementService } from "@/services/admin/examManagementService";

interface Props {
    /** Current image URL value */
    value: string;
    /** Callback when URL changes (upload or manual input) */
    onChange: (url: string) => void;
    /**
     * partId to determine Cloudinary folder (img_file/exam/{level}/{testTitle}).
     * Required for upload mode. If undefined, upload tab is disabled.
     */
    partId?: number;
    placeholder?: string;
    className?: string;
}

/**
 * Reusable image upload input for exam questions.
 * Supports two modes:
 *   - "url"    → manual text input
 *   - "upload" → file picker → uploads to Cloudinary via /parts/{partId}/upload-image
 *
 * Folder on Cloudinary: img_file/exam/{cefrLevel}/{testTitle}
 * e.g. img_file/exam/A2/Test 1
 */
export default function ExamImageUploadInput({
    value,
    onChange,
    partId,
    placeholder = "https://...",
    className,
}: Props) {
    const [mode, setMode] = useState<"url" | "upload">("url");
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const inputCls =
        "w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:bg-white";

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || partId === undefined) return;
        setUploading(true);
        try {
            const url = await examManagementService.uploadQuestionImage(partId, file);
            onChange(url);
            toast.success("Upload ảnh thành công");
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(msg ?? "Upload ảnh thất bại");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }

    return (
        <div className={`space-y-2 ${className ?? ""}`}>
            {/* Tab toggle */}
            <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 w-fit">
                <button
                    type="button"
                    onClick={() => setMode("url")}
                    className={[
                        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition",
                        mode === "url"
                            ? "bg-white text-orange-600 shadow-sm"
                            : "text-gray-400 hover:text-gray-600",
                    ].join(" ")}
                >
                    <LinkIcon size={11} /> Nhập URL
                </button>
                <button
                    type="button"
                    disabled={partId === undefined}
                    onClick={() => setMode("upload")}
                    className={[
                        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition",
                        mode === "upload"
                            ? "bg-white text-orange-600 shadow-sm"
                            : "text-gray-400 hover:text-gray-600",
                        partId === undefined ? "opacity-40 cursor-not-allowed" : "",
                    ].join(" ")}
                    title={partId === undefined ? "Chọn Part trước để upload" : undefined}
                >
                    <Upload size={11} /> Upload file
                </button>
            </div>

            {/* URL input */}
            {mode === "url" && (
                <input
                    type="text"
                    className={inputCls}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                />
            )}

            {/* Upload area */}
            {mode === "upload" && (
                <div className="space-y-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <div
                        className={[
                            "flex items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-4 text-sm transition cursor-pointer",
                            uploading
                                ? "border-orange-200 bg-orange-50 text-orange-400"
                                : "border-gray-200 bg-gray-50 text-gray-400 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-500",
                        ].join(" ")}
                        onClick={() => !uploading && fileInputRef.current?.click()}
                    >
                        {uploading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Đang upload...
                            </>
                        ) : (
                            <>
                                <Upload size={16} />
                                Chọn ảnh (JPG, PNG, WEBP, GIF — tối đa 5MB)
                            </>
                        )}
                    </div>

                    {/* Show current URL after upload */}
                    {value && (
                        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                            <span className="flex-1 truncate text-xs text-gray-500">{value}</span>
                            <button
                                type="button"
                                onClick={() => onChange("")}
                                className="shrink-0 p-1 rounded text-gray-300 hover:text-red-400 transition"
                                title="Xóa URL"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
