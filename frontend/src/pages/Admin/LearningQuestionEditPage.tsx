import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

export default function LearningQuestionEditPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const question = (location.state as any)?.question;

  const [form, setForm] = useState(() => ({
    level: question?.level ?? "L1",
    type: question?.type ?? "Trắc nghiệm",
    title: question?.title ?? "",
    preview: question?.preview ?? "",
    audio: question?.audio ?? "",
    status: question?.status ?? "Hiển thị",
    note: question?.note ?? "",
  }));

  function handleSave() {
    toast.success(id ? "Đã lưu thay đổi (local)" : "Đã thêm câu hỏi (local)");
    navigate('/admin/learning');
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/admin/learning')} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-orange-700">
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
          <h1 className="mt-3 text-2xl font-extrabold text-slate-900">{id ? 'Sửa câu hỏi' : 'Thêm câu hỏi'}</h1>
          <p className="mt-1 text-sm text-slate-500">Chỉnh sửa hoặc thêm mới câu hỏi</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label>
            <div className="text-xs text-gray-400">Level</div>
            <select value={form.level} onChange={(e) => setForm({...form, level: e.target.value})} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
              <option value="L1">L1</option>
              <option value="L2">L2</option>
              <option value="L3">L3</option>
            </select>
          </label>

          <label>
            <div className="text-xs text-gray-400">Loại</div>
            <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
              <option value="Trắc nghiệm">Trắc nghiệm</option>
              <option value="Nghe">Nghe</option>
              <option value="Nói">Nói</option>
              <option value="Đọc">Đọc</option>
              <option value="Viết">Viết</option>
            </select>
          </label>

          <label className="md:col-span-2">
            <div className="text-xs text-gray-400">Câu hỏi</div>
            <input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm" />
          </label>

          <label className="md:col-span-2">
            <div className="text-xs text-gray-400">Nội dung preview</div>
            <textarea value={form.preview} onChange={(e) => setForm({...form, preview: e.target.value})} className="mt-1 min-h-[120px] w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm" />
          </label>

          <label>
            <div className="text-xs text-gray-400">Audio</div>
            <input value={form.audio} onChange={(e) => setForm({...form, audio: e.target.value})} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm" />
          </label>

          <label>
            <div className="text-xs text-gray-400">Trạng thái</div>
            <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
              <option value="Hiển thị">Hiển thị</option>
              <option value="Ẩn">Ẩn</option>
            </select>
          </label>

          <label className="md:col-span-2">
            <div className="text-xs text-gray-400">Ghi chú</div>
            <textarea value={form.note} onChange={(e) => setForm({...form, note: e.target.value})} className="mt-1 min-h-[100px] w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm" />
          </label>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button onClick={() => navigate('/admin/learning')} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Huỷ</button>
          <button onClick={handleSave} className="rounded-xl bg-[#b56b47] px-4 py-2.5 text-sm font-bold text-white">Lưu</button>
        </div>
      </div>
    </div>
  );
}
