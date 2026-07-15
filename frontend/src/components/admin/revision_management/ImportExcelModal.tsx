import { toast } from "react-hot-toast";
import ExcelImportModal, { type ColDef, type ImportResult } from "@/components/admin/common/ExcelImportModal";
import { revisionApi, type AdminTaskDetail } from "@/services/revisionService";

// ─── Column definitions per question type ─────────────────────────────────────
type QuestionType = "VOCAB_IMAGE" | "LISTENING" | "MATCHING" | "WRITING" | "WRITING_MULTI";

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
  WRITING_MULTI: [
    { key: "question",       label: "Câu hỏi",        required: true  },
    { key: "answer",         label: "Đáp án",         required: true  },
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
    return errs;
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  topicId: number;
  taskId: number;
  task: AdminTaskDetail;
  isMultiWriting?: boolean;
  onClose: () => void;
  onImported: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function RevisionImportModal({ topicId, taskId, task, isMultiWriting, onClose, onImported }: Props) {
  const rawType = task.questionType as QuestionType;
  const type: QuestionType = (rawType === "WRITING" && isMultiWriting) ? "WRITING_MULTI" : rawType;

  const handleSubmit = async (file: File): Promise<ImportResult> => {
    try {
      const res = await revisionApi.importQuestions(
        topicId,
        taskId,
        file,
        isMultiWriting ? "multi" : undefined
      );
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

  return (
    <ExcelImportModal
      title="Import Questions"
      subtitle={`Task: ${task.taskLabel} · `}
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
