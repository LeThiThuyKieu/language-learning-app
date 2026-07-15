import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import ExcelImportModal, { type ColDef, type ImportResult } from "@/components/admin/common/ExcelImportModal";
import { adminApi, adminMeta } from "@/services/learningService";
import { Loader2 } from "lucide-react";

type ImportType = "VOCAB" | "LISTENING" | "SPEAKING" | "MATCHING";

const COLUMNS: Record<ImportType, ColDef[]> = {
  VOCAB: [
    { key: "question_text",  label: "Question Text",  required: true  },
    { key: "option_1",       label: "Option 1",        required: true  },
    { key: "option_2",       label: "Option 2",        required: true  },
    { key: "option_3",       label: "Option 3",        required: false },
    { key: "option_4",       label: "Option 4",        required: false },
    { key: "correct_answer", label: "Correct Answer",  required: true  },
    { key: "audio_url",      label: "Audio URL",       required: false },
  ],
  LISTENING: [
    { key: "question_text",  label: "Question Text (blanks = ......)", required: true  },
    { key: "blank_count",    label: "Blank Count",     required: true  },
    { key: "correct_answer", label: "Correct Answer",  required: true  },
    { key: "audio_url",      label: "Audio URL",       required: false },
  ],
  SPEAKING: [
    { key: "question_text",  label: "Question Text (lines separated by \\n)", required: true  },
    { key: "sample_answer",  label: "Sample Answer",                          required: false },
    { key: "audio_url",      label: "Audio URL",                              required: true  },
  ],
  MATCHING: [
    { key: "left",           label: "Left",            required: true  },
    { key: "right",          label: "Right (Answer)",  required: true  },
  ],
};

function validateRow(type: ImportType) {
  return (fields: Record<string, string>): string[] => {
    const errs: string[] = [];
    const tryUrl = (key: string, label: string) => {
      if (fields[key]) {
        try { new URL(fields[key]); }
        catch { errs.push(`${label} phải là URL hợp lệ`); }
      }
    };
    if (type === "VOCAB")     tryUrl("audio_url", "Audio URL");
    if (type === "LISTENING") tryUrl("audio_url", "Audio URL");
    if (type === "SPEAKING")  tryUrl("audio_url", "Audio URL");
    if (type === "LISTENING" && fields.blank_count && isNaN(Number(fields.blank_count))) {
      errs.push("Blank Count phải là số nguyên");
    }
    return errs;
  };
}

interface Props {
  onClose: () => void;
  onImported: () => void;
}

const TYPE_OPTIONS: { value: ImportType; label: string; color: string }[] = [
  { value: "VOCAB",     label: "VOCAB",     color: "bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100" },
  { value: "LISTENING", label: "LISTENING", color: "bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100"             },
  { value: "SPEAKING",  label: "SPEAKING",  color: "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" },
  { value: "MATCHING",  label: "MATCHING",  color: "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100" },
];

function TypeSelector({
  levelOptions,
  onSelect,
}: {
  levelOptions: Array<{ id: number; label: string }>;
  onSelect: (type: ImportType, levelId: number | undefined) => void;
}) {
  const [selectedType, setSelectedType]   = useState<ImportType | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | "">("");

  const canProceed = selectedType !== null && selectedLevel !== "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-base font-extrabold text-gray-900">Import Learning Questions</h2>
          <p className="text-xs text-gray-400 mt-0.5">Chọn loại câu hỏi và level trước khi import</p>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Type */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Loại câu hỏi <span className="text-red-500">*</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedType(opt.value)}
                  className={[
                    "rounded-xl border px-3 py-2.5 text-xs font-bold transition",
                    selectedType === opt.value
                      ? opt.color + " ring-2 ring-offset-1 ring-current"
                      : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Level */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Level <span className="text-red-500">*</span>
            </p>
            <select
              value={selectedLevel}
              onChange={e => setSelectedLevel(e.target.value === "" ? "" : Number(e.target.value))}
              className={[
                "w-full rounded-xl border bg-gray-50 px-4 py-2.5 text-sm outline-none transition",
                selectedLevel === ""
                  ? "border-gray-200 focus:border-orange-300 focus:bg-white"
                  : "border-orange-300 bg-white",
              ].join(" ")}
            >
              <option value="">— Chọn level —</option>
              {levelOptions.map(l => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
            {selectedLevel === "" && (
              <p className="mt-1 text-xs text-red-400">Bắt buộc phải chọn level</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 pb-5">
          <button
            onClick={() => onSelect(null as unknown as ImportType, undefined)}
            className="px-4 py-2 rounded-2xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
          >
            Hủy
          </button>
          <button
            disabled={!canProceed}
            onClick={() => onSelect(selectedType!, selectedLevel as number)}
            className="px-5 py-2 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition disabled:opacity-40"
          >
            Tiếp theo →
          </button>
        </div>
      </div>
    </div>
  );
}
export default function LearningImportModal({ onClose, onImported }: Props) {
  const [selectedType, setSelectedType]   = useState<ImportType | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | undefined>(undefined);
  const [levelOptions, setLevelOptions]   = useState<Array<{ id: number; label: string }>>([]);
  const [loadingMeta, setLoadingMeta]     = useState(true);

  // Fetch level options once
  useEffect(() => {
    adminMeta.getLevels()
      .then(levels => setLevelOptions(levels.map(l => ({ id: l.id, label: l.levelName || `L${l.id}` }))))
      .catch(() => {})
      .finally(() => setLoadingMeta(false));
  }, []);

  const handleTypeSelect = (type: ImportType, levelId: number | undefined) => {
    if (!type) { onClose(); return; }
    setSelectedType(type);
    setSelectedLevel(levelId);
  };

  const handleSubmit = async (file: File): Promise<ImportResult> => {
    try {
      const res = await adminApi.importQuestions(file, selectedType!, selectedLevel);
      if (res.data.imported > 0) {
        toast.success(`Import thành công ${res.data.imported} câu hỏi`);
      }
      return res.data;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? "Import thất bại";
      toast.error(msg);
      return { imported: 0, errors: [msg] };
    }
  };

  if (loadingMeta) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!selectedType) {
    return (
      <TypeSelector
        levelOptions={levelOptions}
        onSelect={handleTypeSelect}
      />
    );
  }

  const levelLabel = levelOptions.find(l => l.id === selectedLevel)?.label ?? `L${selectedLevel}`;

  return (
    <ExcelImportModal
      title="Import Learning Questions"
      subtitle={`Type: ${selectedType} · ${levelLabel}`}
      columns={COLUMNS[selectedType]}
      sheetName={selectedType}
      templateUrl={`/learning/${selectedType}.xlsx`}
      validateRow={validateRow(selectedType)}
      onSubmit={handleSubmit}
      onClose={onClose}
      onDone={onImported}
    />
  );
}
