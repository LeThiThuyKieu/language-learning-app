import { toast } from "react-hot-toast";
import ExcelImportModal, { type ColDef, type ImportResult } from "@/components/admin/common/ExcelImportModal";
import { revisionApi, type AdminTaskDetail } from "@/services/revisionService";

// ─── Column definitions per question type ─────────────────────────────────────
type QuestionType = "VOCAB_IMAGE" | "LISTENING" | "MATCHING" | "WRITING";

const COLUMNS: Record<QuestionType, ColDef[]> = {
  VOCAB_IMAGE: [
    { key: "image_url",      label: "Image URL",      required: true  },
    { key: "correct_answer", label: "Correct Answer", required: true  },
  ],
  LISTENING: [
    { key: "image_url",      label: "Image URL",      required: false },
    { key: "audio_url",      label: "Audio URL",      required: true  },
    { key: "sentence",       label: "Sentence",       required: false },
    { key: "correct_answer", label: "Correct Answer", required: true  },
  ],
  MATCHING: [
    { key: "left",           label: "Left",           required: true  },
    { key: "right",          label: "Right",          required: true  },
  ],
  WRITING: [
    { key: "image_url",      label: "Image URL",      required: false },
    { key: "category_label", label: "Category",       required: true  },
    { key: "category_slots", label: "Slots",          required: false },
    { key: "correct_answer", label: "Answer JSON",    required: false },
  ],
};

// Extra client-side validation per type
function validateRow(type: QuestionType) {
  return (fields: Record<string, string>): string[] => {
    const errs: string[] = [];
    const tryUrl = (key: string, label: string) => {
      if (fields[key]) {
        try { new URL(fields[key]); }
        catch { errs.push(`${label} phải là URL hợp lệ`); }
      }
    };
    if (type === "VOCAB_IMAGE") tryUrl("image_url",  "Image URL");
    if (type === "LISTENING")   tryUrl("audio_url",  "Audio URL");
    if (type === "MATCHING") {
      // no extra validation needed
    }
    return errs;
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  topicId: number;
  taskId: number;
  task: AdminTaskDetail;
  onClose: () => void;
  onImported: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function RevisionImportModal({ topicId, taskId, task, onClose, onImported }: Props) {
  const type = task.questionType as QuestionType;

  const handleSubmit = async (file: File): Promise<ImportResult> => {
    try {
      const res = await revisionApi.importQuestions(topicId, taskId, file);
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

  const typeColor =
    type === "VOCAB_IMAGE" ? "text-violet-500" :
    type === "LISTENING"   ? "text-sky-500"    :
    type === "MATCHING"    ? "text-emerald-600":
                             "text-amber-500";

  return (
    <ExcelImportModal
      title="Import Questions"
      subtitle={
        `Task: ${task.taskLabel} · `
      }
      columns={COLUMNS[type] ?? []}
      sheetName={type}
      templateUrl={`/general_revision/${type}.xlsx`}
      validateRow={validateRow(type)}
      onSubmit={handleSubmit}
      onClose={onClose}
      onDone={onImported}
    />
  );
}
