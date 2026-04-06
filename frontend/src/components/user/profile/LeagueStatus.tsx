interface LeagueProps {
    rank: number;
    trend: 'up' | 'down' | 'stable';
    leagueName: string;
}

export default function LeagueStatus({ rank, trend, leagueName }: LeagueProps) {
    const trendIcon = trend === 'up' ? '↗️' : trend === 'down' ? '↘️' : '➡️';
    const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-slate-400';

    return (
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-[0_4px_0_0_rgba(226,232,240,1)] flex justify-between items-center">
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Giải đấu hiện tại</p>
                <p className="text-lg font-black text-indigo-600 uppercase italic">{leagueName} League</p>
            </div>
            <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase">Trạng thái</p>
                <div className="flex items-center gap-1 justify-end">
                    <span className={`font-black ${trendColor}`}>{trendIcon} Hạng {rank}</span>
                </div>
                {rank <= 3 && <p className="text-[9px] font-bold text-yellow-500 uppercase">Vùng thăng hạng!</p>}
            </div>
        </div>
    );
}