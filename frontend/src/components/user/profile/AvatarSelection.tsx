import { useState } from 'react';

// Danh sách gợi ý chuẩn "điệu" và đa dạng
const SUGGESTIONS = [
    { id: '1', url: "https://api.dicebear.com/9.x/lorelei/svg?seed=Sophie" },     // Nữ điệu
    { id: '2', url: "https://api.dicebear.com/9.x/adventurer/svg?seed=Felix" },   // Nam lãng tử
    { id: '3', url: "https://api.dicebear.com/9.x/thumbs/svg?seed=Bear" },       // Gấu đáng yêu
    { id: '4', url: "https://api.dicebear.com/9.x/thumbs/svg?seed=Rabbit" },     // Thỏ hồng
    { id: '5', url: "https://api.dicebear.com/9.x/big-smile/svg?seed=Cookie" },  // Mặt cười hóm hỉnh
    { id: '6', url: "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Sky" } // Robot cute
];

interface AvatarSelectionProps {
    onSelect: (url: string) => void;
    currentValue: string; // Nhận ảnh hiện tại từ ProfilePage
}

export default function AvatarSelection({ onSelect, currentValue }: AvatarSelectionProps) {
    // Mặc định lấy ảnh đang dùng, nếu không có thì lấy con gấu (thứ 3)
    const defaultImg = SUGGESTIONS[2].url;
    const [previewAvatar, setPreviewAvatar] = useState(currentValue || defaultImg);

    const handleSelect = (url: string) => {
        setPreviewAvatar(url);
        onSelect(url); // Gửi link lên cho ProfilePage cập nhật state user
    };

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-200 shadow-xl max-w-sm mx-auto">
            <h3 className="text-center text-lg font-black text-primary-900 mb-6 uppercase tracking-wider italic">
                Chọn nhân vật của bạn
            </h3>

            {/* Preview Avatar đang chọn - Hình tròn */}
            <div className="flex justify-center mb-10">
                <div className="relative">
                    <div className="w-32 h-32 rounded-full border-4 border-primary-500 p-1 bg-white shadow-md">
                        <img
                            src={previewAvatar}
                            className="w-full h-full rounded-full object-cover bg-slate-50"
                            alt="Avatar Preview"
                        />
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow-lg border-2 border-white whitespace-nowrap uppercase">
                        Đang chọn
                    </div>
                </div>
            </div>

            {/* Grid danh sách gợi ý - Tất cả hình tròn */}
            <div className="grid grid-cols-3 gap-5 mb-8">
                {SUGGESTIONS.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => handleSelect(item.url)}
                        className={`aspect-square rounded-full border-2 transition-all duration-200 overflow-hidden p-1
                            ${previewAvatar === item.url
                            ? 'border-primary-500 bg-slate-50 scale-110 shadow-sm'
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

            {/* Nút Tự tải lên - Bo tròn theo phong cách mới */}
            <div className="relative">
                <input
                    type="file"
                    id="avatar-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            const localUrl = URL.createObjectURL(file);
                            handleSelect(localUrl);
                        }
                    }}
                />
                <label
                    htmlFor="avatar-upload"
                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-slate-100 text-primary-700 font-black rounded-full border-b-4 border-slate-200 active:border-b-0 active:translate-y-1 transition-all cursor-pointer uppercase text-[11px] tracking-widest"
                >
                    <span>Tải ảnh của bạn lên</span>
                </label>
            </div>
        </div>
    );
}