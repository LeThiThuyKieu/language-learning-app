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
    // SPEAKING: tách title thành array câu
    speakingSentences: question?.title 
      ? question.title.split('\n').map(s => s.trim()).filter(Boolean)
      : [""],
    sampleAnswer: question?.sampleAnswer ?? "",
    keywords: question?.keywords ?? [],
    // Chung
    audio: question?.audio ?? "",
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
          const titleRaw = q.title ?? "";
          setForm({
            level: q.level ?? "L1",
            type: normalizeType(q.type),
            title: titleRaw,
            options: q.options ?? [],
            correctAnswer: q.correctAnswer ?? "",
            blankCount: q.blankCount ?? 0,
            speakingSentences: titleRaw
              ? titleRaw.split('\n').map((s: string) => s.trim()).filter(Boolean)
              : [""],
            sampleAnswer: q.sampleAnswer ?? "",
            keywords: q.keywords ?? [],
            audio: q.audio ?? "",
          });
          setSelectedAnswer(q.correctAnswer ?? q.options?.[0] ?? "");
        })
        .catch(() => toast.error("Không tìm thấy câu hỏi"))
        .finally(() => setLoading(false));
    }
  }, [id, question]);

  async function handleSave() {
    const typeUpper = form.type.toUpperCase();

    if (typeUpper !== "SPEAKING" && !form.title.trim()) {
      toast.error("Vui lòng nhập câu hỏi");
      return;
    }
    
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
      if (form.speakingSentences.filter(s => s.trim()).length === 0) {
        toast.error("Vui lòng nhập ít nhất 1 câu cho Speaking");
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
        };
        
        // Add type-specific fields
        if (typeUpper === "VOCAB") {
          payload.options = form.options;
          payload.correctAnswer = form.correctAnswer;
        } else if (typeUpper === "LISTENING") {
          payload.blankCount = form.blankCount;
          payload.correctAnswer = form.correctAnswer;
        } else if (typeUpper === "SPEAKING") {
          // Ghép speakingSentences lại thành 1 string, lưu vào questionText
          payload.questionText = form.speakingSentences.filter(s => s.trim()).join('\n');
          payload.sampleAnswer = form.sampleAnswer;
        } else if (typeUpper === "MATCHING") {
          payload.correctAnswer = form.correctAnswer;
        }

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
        };
        
        // Add type-specific fields
        if (typeUpper === "VOCAB") {
          payload.options = form.options;
          payload.correctAnswer = form.correctAnswer;
        } else if (typeUpper === "LISTENING") {
          payload.blankCount = form.blankCount;
          payload.correctAnswer = form.correctAnswer;
        } else if (typeUpper === "SPEAKING") {
          // Ghép speakingSentences lại thành 1 string, lưu vào questionText
          payload.questionText = form.speakingSentences.filter(s => s.trim()).join('\n');
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

          {form.type !== 'Speaking' && (
            <label className="md:col-span-2">
              <div className="text-xs text-gray-400">Câu hỏi</div>
              <input value={form.title} disabled={mode === 'view'} onChange={(e) => setForm({...form, title: e.target.value})} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm" />
            </label>
          )}

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
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400">Danh sách câu (mỗi câu = 1 dòng luyện nói)</div>
                {mode !== 'view' && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, speakingSentences: [...form.speakingSentences, ""] })}
                    className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                  >
                    + Thêm câu
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {form.speakingSentences.map((sentence, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="shrink-0 text-xs font-bold text-gray-400 w-14">Câu {idx + 1}</span>
                    {mode === 'view' ? (
                      <div className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
                        {sentence || <span className="text-gray-400 italic">(trống)</span>}
                      </div>
                    ) : (
                      <>
                        <input
                          value={sentence}
                          onChange={(e) => {
                            const next = [...form.speakingSentences];
                            next[idx] = e.target.value;
                            setForm({ ...form, speakingSentences: next });
                          }}
                          className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                          placeholder={`Câu ${idx + 1}...`}
                        />
                        {form.speakingSentences.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = form.speakingSentences.filter((_, i) => i !== idx);
                              setForm({ ...form, speakingSentences: next });
                            }}
                            className="shrink-0 text-red-400 hover:text-red-600 text-xs font-bold px-1"
                            aria-label="Xóa câu"
                          >
                            ✕
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
              {form.speakingSentences.length === 0 && mode !== 'view' && (
                <p className="text-xs text-gray-400 italic">Chưa có câu nào. Nhấn "+ Thêm câu" để thêm.</p>
              )}
            </div>
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
