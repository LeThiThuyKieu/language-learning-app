
interface ActivityProps {
    data: number[];
}


export default function Activity({ data }: ActivityProps) {
    // Nếu không có dữ liệu truyền vào, dùng một mảng mặc định để tránh lỗi trắng trang
    const chartData = data || [0, 0, 0, 0, 0, 0, 0];

    return (
        <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl">
            <h3 className="font-black mb-6 uppercase tracking-wider text-sm">
                Hoạt động tuần này
            </h3>

            <div className="flex items-end justify-between h-32 gap-2">
                {chartData.map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        {/* Cột biểu đồ */}
                        <div
                            className="w-full rounded-t-lg transition-all duration-500 ease-out"
                            style={{
                                height: `${h}%`,
                                backgroundColor: "#fe4d01",
                                boxShadow: "0 0 15px rgba(254, 77, 1, 0.3)"
                            }}
                        ></div>

                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                            T{i + 2}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}