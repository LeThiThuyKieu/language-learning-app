interface AccuracyProps {
    percent: number; // Ví dụ: 92
}

export default function AccuracyStats({ percent }: AccuracyProps) {
    return (
        <div className="bg-indigo-600 rounded-2xl p-4 text-white shadow-[0_4px_0_0_rgba(79,70,229,1)] flex flex-col items-center text-center">
            <span className="text-[10px] font-black opacity-80 uppercase tracking-widest">Độ chính xác</span>
            <div className="relative my-2">
                {/* Một cái vòng tròn đơn giản hoặc text lớn */}
                <span className="text-4xl font-black italic">{percent}%</span>
            </div>
            <p className="text-[10px] font-medium leading-tight opacity-90">
                {percent > 90 ? "Bạn thực sự là một chuyên gia!" : "Luyện tập thêm để đạt 100% nhé!"}
            </p>
        </div>
    );
}