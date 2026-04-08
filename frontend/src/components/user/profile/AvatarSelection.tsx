import { ChangeEvent, useCallback, useMemo, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { profileService } from "@/services/profileService";

// Danh sách gợi ý chuẩn "điệu" và đa dạng
const SUGGESTIONS = [
    { id: "1", url: "https://api.dicebear.com/9.x/lorelei/svg?seed=Sophie" },
    { id: "2", url: "https://api.dicebear.com/9.x/adventurer/svg?seed=Felix" },
    { id: "3", url: "https://api.dicebear.com/9.x/thumbs/svg?seed=Bear" },
    { id: "4", url: "https://api.dicebear.com/9.x/thumbs/svg?seed=Rabbit" },
    { id: "5", url: "https://api.dicebear.com/9.x/big-smile/svg?seed=Cookie" },
    { id: "6", url: "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Sky" },
];

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
]);
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".jprg", ".png", ".webp"]);

interface AvatarSelectionProps {
    onSelect: (url: string) => void;
    currentValue: string;
}

export default function AvatarSelection({ onSelect, currentValue }: AvatarSelectionProps) {
    const defaultImg = SUGGESTIONS[2].url;
    const [previewAvatar, setPreviewAvatar] = useState(currentValue || defaultImg);
    const [cropSource, setCropSource] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const helperText = useMemo(
        () => "Chỉ hỗ trợ JPG/JPRG, PNG, WEBP và dung lượng tối đa 2MB.",
        []
    );

    const handleSelect = (url: string) => {
        setPreviewAvatar(url);
        onSelect(url);
    };

    const validateFile = (file: File) => {
        if (file.size > MAX_AVATAR_SIZE_BYTES) {
            return "Ảnh phải nhỏ hơn 2MB.";
        }

        const fileName = file.name.toLowerCase();
        const extensionIndex = fileName.lastIndexOf(".");
        const extension = extensionIndex >= 0 ? fileName.substring(extensionIndex) : "";

        if (!ALLOWED_EXTENSIONS.has(extension)) {
            return "Chỉ cho phép định dạng JPG/JPRG, PNG hoặc WEBP.";
        }

        if (file.type && !ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
            return "Định dạng ảnh không hợp lệ.";
        }

        return null;
    };

    const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;

        const validationError = validateFile(file);
        if (validationError) {
            setErrorMessage(validationError);
            return;
        }

        const localUrl = URL.createObjectURL(file);
        setErrorMessage(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        setCropSource(localUrl);
    };

    const closeCropModal = () => {
        if (cropSource?.startsWith("blob:")) {
            URL.revokeObjectURL(cropSource);
        }
        setCropSource(null);
    };

    const saveCroppedAvatar = async () => {
        if (!cropSource || !croppedAreaPixels) {
            setErrorMessage("Không thể cắt ảnh. Vui lòng thử lại.");
            return;
        }

        try {
            setIsUploading(true);
            setErrorMessage(null);

            const croppedBlob = await getCroppedImageBlob(cropSource, croppedAreaPixels);
            if (croppedBlob.size > MAX_AVATAR_SIZE_BYTES) {
                setErrorMessage("Ảnh sau khi cắt vẫn lớn hơn 2MB. Vui lòng chọn ảnh nhỏ hơn.");
                return;
            }

            const uploadFile = new File([croppedBlob], `avatar-${Date.now()}.jpg`, {
                type: "image/jpeg",
            });

            const uploadedUrl = await profileService.uploadAvatar(uploadFile);
            handleSelect(uploadedUrl);
            closeCropModal();
        } catch {
            setErrorMessage("Upload ảnh thất bại. Vui lòng thử lại.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto px-2 sm:px-3 py-3">
            <h3 className="text-center text-xl font-black text-[#1f1a17] mb-7 uppercase tracking-wider italic">
                Chọn nhân vật của bạn
            </h3>

            {/* Preview Avatar đang chọn - Hình tròn */}
            <div className="flex justify-center mb-7">
                <div className="relative">
                    <div className="w-32 h-32 rounded-full border-4 border-primary-500 p-1 bg-white">
                        <img
                            src={previewAvatar}
                            className="w-full h-full rounded-full object-cover bg-slate-50"
                            alt="Avatar Preview"
                        />
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-[11px] font-extrabold px-3.5 py-1 rounded-full border-2 border-white whitespace-nowrap uppercase">
                        Đang chọn
                    </div>
                </div>
            </div>

            {/* Grid danh sách gợi ý - Tất cả hình tròn */}
            <div className="grid grid-cols-3 gap-5 mb-6 justify-items-center">
                {SUGGESTIONS.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => handleSelect(item.url)}
                        className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 transition-all duration-200 overflow-hidden p-1
                            ${previewAvatar === item.url
                            ? 'border-primary-500 bg-slate-50 scale-110'
                            : 'border-slate-200 hover:border-primary-300 hover:scale-105'
                        }`}
                    >
                        <img
                            src={item.url}
                            alt="Option"
                            className="w-full h-full rounded-full object-contain"
                        />
                    </button>
                ))}
            </div>

            {errorMessage && (
                <p className="mb-4 text-xs font-semibold text-red-600 text-center">{errorMessage}</p>
            )}

            <div className="relative">
                <input
                    type="file"
                    id="avatar-upload"
                    className="hidden"
                    accept=".jpg,.jpeg,.jprg,.png,.webp"
                    onChange={handleFileInputChange}
                />
                <label
                    htmlFor="avatar-upload"
                    className="flex items-center justify-center gap-2 w-full py-4 bg-slate-100 text-[#1f1a17] font-black rounded-full border-b-4 border-slate-200 active:border-b-0 active:translate-y-1 transition-all cursor-pointer uppercase text-xs tracking-widest"
                >
                    <span>Tải ảnh của bạn lên</span>
                </label>
                <p className="mt-3 text-[11px] text-red-600 font-semibold text-center">{helperText}</p>
            </div>

            {cropSource && (
                <div className="fixed inset-0 z-[10010] bg-black/70 flex items-center justify-center p-4">
                    <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                            <h4 className="text-base font-extrabold text-slate-900">Căn chỉnh avatar</h4>
                            <button
                                type="button"
                                onClick={closeCropModal}
                                className="text-slate-500 hover:text-slate-700"
                                disabled={isUploading}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="relative h-[320px] bg-slate-900">
                            <Cropper
                                image={cropSource}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="round"
                                showGrid={false}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                            />
                        </div>

                        <div className="p-5 border-t border-slate-200 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Phóng to</label>
                                <input
                                    type="range"
                                    min={1}
                                    max={3}
                                    step={0.01}
                                    value={zoom}
                                    onChange={(event) => setZoom(Number(event.target.value))}
                                    className="w-full mt-2"
                                    disabled={isUploading}
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeCropModal}
                                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                                    disabled={isUploading}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void saveCroppedAvatar()}
                                    className="px-4 py-2 rounded-xl bg-primary-600 text-white font-semibold disabled:opacity-60"
                                    disabled={isUploading}
                                >
                                    {isUploading ? "Đang upload..." : "Lưu avatar"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener("load", () => resolve(image));
        image.addEventListener("error", (error) => reject(error));
        image.setAttribute("crossOrigin", "anonymous");
        image.src = url;
    });

async function getCroppedImageBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
        throw new Error("Canvas is not supported");
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    context.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error("Failed to create blob"));
                    return;
                }
                resolve(blob);
            },
            "image/jpeg",
            0.92
        );
    });
}