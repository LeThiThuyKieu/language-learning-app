import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import {getQuestion, adminApi, QuestionPayload} from "@/services/learningService";

const backendTypeToUiType: Record<string, string> = {
  VOCAB: "Vocab",
  LISTENING: "Listening",
  SPEAKING: "Speaking",
  MATCHING: "Matching",
};

function normalizeType(type?: string) {
  if (!type) return "Vocab";
  return backendTypeToUiType[type] ?? type;
}

export default function LearningQuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  interface LocationState {
    question?: {
      level?: string;
      type?: string;
      title?: string;
      options?: string[];
      correctAnswer?: string;
      blankCount?: number;
      sampleAnswer?: string;
      keywords?: string[];
      audio?: string;
      note?: string;
    };
  }

  const question = (location.state as LocationState)?.question;

  // determine mode: 'add' (/new), 'edit' (/:id/edit), 'view' (/:id)
  const pathname = location.pathname;
  const mode: 'add' | 'edit' | 'view' = pathname.endsWith('/new') ? 'add' : pathname.endsWith('/edit') ? 'edit' : id ? 'view' : 'add';

  const [form, setForm] = useState(() => ({
    level: question?.level ?? "L1",
    type: normalizeType(question?.type),
    title: question?.title ?? "",
    // VOCAB
    options: question?.options ?? [],
    correctAnswer: question?.correctAnswer ?? "",
    // LISTENING
    blankCount: question?.blankCount ?? 0,
    // SPEAKING
    sampleAnswer: question?.sampleAnswer ?? "",
    keywords: question?.keywords ?? [],
    // Chung
    audio: question?.audio ?? "",
    // status: question?.status ?? "Hiển thị",
    note: question?.note ?? "",
  }));

  const [selectedAnswer, setSelectedAnswer] = useState<string>(question?.correctAnswer ?? question?.options?.[0] ?? "");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const shouldFetch = Boolean(
      id &&
      (
        !question ||
        !Array.isArray(question.options) ||
        question.options.length === 0 ||
        question.type == null ||
        !backendTypeToUiType[question.type]
      )
    );

    if (shouldFetch && id) {
      setLoading(true);
      getQuestion(id)
        .then((q) => {
          setForm({
            level: q.level ?? "L1",
            type: normalizeType(q.type),
            title: q.title ?? "",
            options: q.options ?? [],
            correctAnswer: q.correctAnswer ?? "",
            blankCount: q.blankCount ?? 0,
            sampleAnswer: q.sampleAnswer ?? "",
            keywords: q.keywords ?? [],
            audio: q.audio ?? "",
            // status: q.status ?? "Hiển thị",
            note: q.note ?? "",
          });
          setSelectedAnswer(q.correctAnswer ?? q.options?.[0] ?? "");
        })
        .catch(() => toast.error("Không tìm thấy câu hỏi"))
        .finally(() => setLoading(false));
    }
  }, [id, question]);

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error("Vui lòng nhập câu hỏi");
      return;
    }

    const typeUpper = form.type.toUpperCase();
    
    // Validate type-specific fields
    if (typeUpper === "VOCAB") {
      if (form.options.length === 0) {
        toast.error("Vui lòng thêm ít nhất 1 tùy chọn");
        return;
      }
      if (!form.correctAnswer.trim()) {
        toast.error("Vui lòng chọn đáp án đúng");
        return;
      }
    } else if (typeUpper === "LISTENING") {
      if (!form.blankCount || form.blankCount < 1) {
        toast.error("Vui lòng nhập số khoảng trống");
        return;
      }
      if (!form.correctAnswer.trim()) {
        toast.error("Vui lòng nhập đáp án nghe cho listening");
        return;
      }
    } else if (typeUpper === "SPEAKING") {
      if (!form.sampleAnswer.trim()) {
        toast.error("Vui lòng nhập đáp án mẫu");
        return;
      }
    } else if (typeUpper === "MATCHING") {
      if (!form.correctAnswer.trim()) {
        toast.error("Vui lòng nhập đáp án ghép");
        return;
      }
    }

    if (mode === 'add') {
      try {
        const levelId = parseInt(form.level.replace('L', '')) || 1;
        const payload: QuestionPayload = {
          levelId,
          type: typeUpper,
          questionText: form.title,
          audioUrl: form.audio || undefined,
          explanation: form.note || undefined,
        };
        
        // Add type-specific fields
        if (typeUpper === "VOCAB") {
          payload.options = form.options;
          payload.correctAnswer = form.correctAnswer;
        } else if (typeUpper === "LISTENING") {
          payload.blankCount = form.blankCount;
          payload.correctAnswer = form.correctAnswer;
        } else if (typeUpper === "SPEAKING") {
          payload.sampleAnswer = form.sampleAnswer;
        } else if (typeUpper === "MATCHING") {
          payload.correctAnswer = form.correctAnswer;        }

        const result = await adminApi.createQuestion(payload);
        toast.success("Đã thêm câu hỏi");
        navigate(`/admin/learning/${result.id}`, { state: { question: form } });
      } catch (e) {
        console.error(e);
        toast.error("Lỗi khi thêm câu hỏi");
      }
      return;
    }

    // edit mode
    if (id) {
      try {
        const levelId = parseInt(form.level.replace('L', '')) || 1;
        const payload: QuestionPayload = {
          levelId,
          type: typeUpper,
          questionText: form.title,
          audioUrl: form.audio || undefined,
          explanation: form.note || undefined,
        };
        
        // Add type-specific fields
        if (typeUpper === "VOCAB") {
          payload.options = form.options;
          payload.correctAnswer = form.correctAnswer;
        } else if (typeUpper === "LISTENING") {
          payload.blankCount = form.blankCount;
          payload.correctAnswer = form.correctAnswer;
        } else if (typeUpper === "SPEAKING") {
          payload.sampleAnswer = form.sampleAnswer;
        } else if (typeUpper === "MATCHING") {
          payload.correctAnswer = form.correctAnswer;
        }

        await adminApi.updateQuestion(id, payload);
        toast.success("Đã lưu thay đổi");
        navigate(`/admin/learning/${id}`, { state: { question: form } });
      } catch (e) {
        console.error(e);
        toast.error("Lỗi khi cập nhật câu hỏi");
      }
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/admin/learning')} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-orange-700">
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
          <h1 className="mt-3 text-2xl font-extrabold text-slate-900">{mode === 'add' ? 'Thêm câu hỏi' : mode === 'edit' ? 'Sửa câu hỏi' : 'Xem câu hỏi'}</h1>
          <p className="mt-1 text-sm text-slate-500">{mode === 'view' ? 'Xem chi tiết câu hỏi' : 'Chỉnh sửa hoặc thêm mới câu hỏi'}</p>
        </div>

        {mode === 'view' && id && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/admin/learning/${id}/edit`, { state: { question } })}
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-orange-500/30"
            >
              Chỉnh sửa
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">Đang tải...</div>
        ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label>
            <div className="text-xs text-gray-400">Level</div>
            <select value={form.level} disabled={mode === 'view'} onChange={(e) => setForm({...form, level: e.target.value})} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
              <option value="L1">L1</option>
              <option value="L2">L2</option>
              <option value="L3">L3</option>
            </select>
          </label>

          <label>
            <div className="text-xs text-gray-400">Loại</div>
            <select value={form.type} disabled={mode === 'view'} onChange={(e) => setForm({...form, type: e.target.value})} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
              <option value="Vocab">Vocab</option>
              <option value="Listening">Listening</option>
              <option value="Speaking">Speaking</option>
              <option value="Matching">Matching</option>
            </select>
          </label>

          <label className="md:col-span-2">
            <div className="text-xs text-gray-400">Câu hỏi</div>
            <input value={form.title} disabled={mode === 'view'} onChange={(e) => setForm({...form, title: e.target.value})} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm" />
          </label>

          {/* ========== VOCAB ========== */}
          {form.type === 'Vocab' && (
            <>
              <label className="md:col-span-2">
                <div className="text-xs text-gray-400">Các tùy chọn (mỗi dòng một tùy chọn)</div>
                {mode === 'view' ? (
                  <div className="mt-1 grid gap-2">
                    {form.options.length > 0 ? (
                      form.options.map((option: string) => (
                        <label key={option} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm transition hover:border-orange-300 hover:bg-orange-50">
                          <input
                            type="radio"
                            name="selectedAnswer"
                            value={option}
                            checked={selectedAnswer === option}
                            onChange={() => setSelectedAnswer(option)}
                            className="h-4 w-4 border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <span className="text-slate-700">{option}</span>
                          {option === form.correctAnswer && <span className="ml-auto text-xs font-semibold text-emerald-600">✓ Đúng</span>}
                        </label>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-slate-500">
                        Không có tùy chọn để chọn.
                      </div>
                    )}
                  </div>
                ) : (
                  <textarea 
                    value={form.options.join('\n')} 
                    onChange={(e) => setForm({...form, options: e.target.value.split('\n').filter(o => o.trim())})} 
                    className="mt-1 min-h-[120px] w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                    placeholder="Nhập các tùy chọn, mỗi dòng một tùy chọn"
                  />
                )}
              </label>

              <label className="md:col-span-2">
                <div className="text-xs text-gray-400">Đáp án đúng</div>
                {mode === 'view' ? (
                  <div className="mt-1 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-semibold">
                    {form.correctAnswer || 'Chưa có đáp án'}
                  </div>
                ) : (
                  <select 
                    value={form.correctAnswer} 
                    onChange={(e) => setForm({...form, correctAnswer: e.target.value})} 
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                  >
                    <option value="">-- Chọn đáp án --</option>
                    {form.options.map((option: string) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}
              </label>
            </>
          )}

          {/* ========== LISTENING ========== */}
          {form.type === 'Listening' && (
            <>
              <label className="md:col-span-2">
                <div className="text-xs text-gray-400">Số khoảng trống cần điền</div>
                <input 
                  type="number" 
                  min="1" 
                  value={form.blankCount} 
                  disabled={mode === 'view'} 
                  onChange={(e) => setForm({...form, blankCount: parseInt(e.target.value) || 0})} 
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm" 
                />
              </label>

              <label className="md:col-span-2">
                <div className="text-xs text-gray-400">Đáp án nghe điền vào</div>
                <textarea 
                  value={form.correctAnswer} 
                  disabled={mode === 'view'} 
                  onChange={(e) => setForm({...form, correctAnswer: e.target.value})} 
                  className="mt-1 min-h-[120px] w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm" 
                  placeholder="Nhập dạng 1:name\n2:Nice\n3:live hoặc 1:name | 2:Nice | 3:live"
                />
                <p className="mt-2 text-xs text-slate-500">Mỗi _______(1) hoặc _______(2) trong câu là chỗ cần điền.</p>
              </label>
            </>
          )}

          {/* ========== SPEAKING ========== */}
          {form.type === 'Speaking' && (
            <label className="md:col-span-2">
              <div className="text-xs text-gray-400">Đáp án mẫu</div>
              <textarea 
                value={form.sampleAnswer} 
                disabled={mode === 'view'} 
                onChange={(e) => setForm({...form, sampleAnswer: e.target.value})} 
                className="mt-1 min-h-[120px] w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm" 
                placeholder="Nhập đáp án mẫu"
              />
            </label>
          )}

          {/* ========== MATCHING ========== */}
          {form.type === 'Matching' && (
              <label className="md:col-span-2">
                <div className="text-xs text-gray-400">
                  Đáp án ghép đúng
                </div>

                {mode === 'view' ? (
                    <div className="mt-1 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-semibold">
                      {form.correctAnswer || 'Chưa có đáp án'}
                    </div>
                ) : (
                    <input
                        value={form.correctAnswer}
                        onChange={(e) =>
                            setForm({
                              ...form,
                              correctAnswer: e.target.value,
                            })
                        }
                        className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                        placeholder="Nhập đáp án ghép đúng"
                    />
                )}
              </label>
          )}

          <label>
            <div className="text-xs text-gray-400">Audio</div>
            <input value={form.audio} disabled={mode === 'view'} onChange={(e) => setForm({...form, audio: e.target.value})} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm" />
          </label>

          <label className="md:col-span-2">
            <div className="text-xs text-gray-400">Ghi chú</div>
            <textarea value={form.note} disabled={mode === 'view'} onChange={(e) => setForm({...form, note: e.target.value})} className="mt-1 min-h-[100px] w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm" />
          </label>
        </div>
        )}
        <div className="mt-6 flex items-center justify-end gap-3">
          {mode !== 'view' && (
            <button onClick={() => navigate('/admin/learning')} className="px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Huỷ</button>
          )}
          {mode !== 'view' && (
            <button onClick={handleSave} className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-orange-500/30">Lưu</button>
          )}
        </div>
      </div>
    </div>
  );
}
