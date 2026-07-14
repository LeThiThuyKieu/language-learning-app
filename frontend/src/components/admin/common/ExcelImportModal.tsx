import { useRef, useState, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  X, FileSpreadsheet, Upload, Download,
  CheckCircle2, AlertCircle, Loader2, Eye,
  ArrowRight, ArrowLeft,
} from "lucide-react";

// ─── Public types ─────────────────────────────────────────────────────────────
export interface ColDef {
  key: string;
  label: string;
  required: boolean;
}

export interface ParsedRow {
  index: number;
  fields: Record<string, string>;
  errors: string[];
  valid: boolean;
}

export interface ImportResult {
  imported: number;
  errors: string[];
}

/**
 * Props for ExcelImportModal (generic, reusable).
 *
 * Consumer provides:
 *   - columns        : column definitions (order matches Excel columns)
 *   - sheetName      : expected sheet name in the workbook
 *   - templateUrl    : href for the template download link
 *   - title / subtitle: shown in header
 *   - validateRow    : optional extra per-row validation beyond required-field checks
 *   - onSubmit       : receives the raw File; returns ImportResult promise
 *   - onClose / onDone
 */
export interface ExcelImportModalProps {
  title: string;
  subtitle?: string;
  columns: ColDef[];
  sheetName: string;
  templateUrl?: string;
  /** Optional extra-row validation, called after built-in required checks */
  validateRow?: (fields: Record<string, string>) => string[];
  /** Called when user confirms – receives the raw File; should call the API */
  onSubmit: (file: File) => Promise<ImportResult>;
  onClose: () => void;
  /** Called after a successful import (imported > 0) */
  onDone?: () => void;
}

type Step = "upload" | "preview" | "result";

// ─── Internal helpers ─────────────────────────────────────────────────────────
function isUrl(v: string) {
  try { new URL(v); return true; } catch { return false; }
}

function findSheet(wb: XLSX.WorkBook, name: string): XLSX.WorkSheet | null {
  if (wb.Sheets[name]) return wb.Sheets[name];
  const ci = wb.SheetNames.find(n => n.toLowerCase() === name.toLowerCase());
  if (ci) return wb.Sheets[ci];
  if (wb.SheetNames.length === 1) return wb.Sheets[wb.SheetNames[0]];
  return null;
}

function parseSheet(
  sheet: XLSX.WorkSheet,
  columns: ColDef[],
  validateRow?: (fields: Record<string, string>) => string[],
): ParsedRow[] {
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    blankrows: false,
  });
  if (raw.length < 2) return [];
  const dataRows = raw.slice(2); // skip header row + description row

  return dataRows
    .map((row, i): ParsedRow => {
      const r = row as unknown[];
      const fields: Record<string, string> = {};
      columns.forEach((col, ci) => {
        const cell = r[ci];
        fields[col.key] = cell == null ? "" : String(cell).trim();
      });

      const errors: string[] = [];
      // Built-in: required check
      columns.forEach(col => {
        if (col.required && !fields[col.key]) errors.push(`${col.label} bắt buộc`);
      });
      // Consumer extra validation
      if (validateRow) errors.push(...validateRow(fields));

      return { index: i + 1, fields, errors, valid: errors.length === 0 };
    })
    .filter(row => Object.values(row.fields).some(v => v !== ""));
}

// ─── Step bar ─────────────────────────────────────────────────────────────────
function StepDot({ active, done, n, label }: { active: boolean; done: boolean; n: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={[
        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition",
        done   ? "bg-emerald-500 text-white" :
        active ? "bg-orange-500 text-white"  :
                 "bg-gray-100 text-gray-400",
      ].join(" ")}>
        {done ? <CheckCircle2 className="w-4 h-4" /> : n}
      </div>
      <span className={`text-xs font-semibold ${active ? "text-orange-600" : done ? "text-emerald-600" : "text-gray-400"}`}>
        {label}
      </span>
    </div>
  );
}

function StepBar({ step }: { step: Step }) {
  const d1 = step === "preview" || step === "result";
  const d2 = step === "result";
  return (
    <div className="flex items-center justify-center gap-2 py-1">
      <StepDot active={step === "upload"}  done={d1} n="1" label="Upload"  />
      <div className={`h-0.5 w-12 rounded transition ${d1 ? "bg-emerald-400" : "bg-gray-200"}`} />
      <StepDot active={step === "preview"} done={d2} n="2" label="Preview" />
      <div className={`h-0.5 w-12 rounded transition ${d2 ? "bg-emerald-400" : "bg-gray-200"}`} />
      <StepDot active={step === "result"}  done={false} n="3" label="Kết quả" />
    </div>
  );
}

// ─── Preview table ────────────────────────────────────────────────────────────
function PreviewTable({ rows, columns }: { rows: ParsedRow[]; columns: ColDef[] }) {
  const valid   = rows.filter(r => r.valid).length;
  const invalid = rows.length - valid;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5" /> {valid} hợp lệ
        </span>
        {invalid > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-bold text-red-600">
            <AlertCircle className="w-3.5 h-3.5" /> {invalid} lỗi
          </span>
        )}
        <span className="text-xs text-gray-400 ml-auto">{rows.length} dòng</span>
      </div>

      <div className="overflow-auto rounded-2xl border border-gray-100 max-h-72">
        <table className="min-w-full text-xs divide-y divide-gray-100">
          <thead className="bg-slate-50 text-gray-500 uppercase tracking-wider font-bold">
            <tr>
              <th className="px-3 py-2.5 text-center w-10">#</th>
              {columns.map(c => (
                <th key={c.key} className="px-3 py-2.5 text-left whitespace-nowrap">
                  {c.label}{c.required && <span className="text-red-400 ml-0.5">*</span>}
                </th>
              ))}
              <th className="px-3 py-2.5 text-center w-20">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(row => (
              <tr key={row.index} className={row.valid ? "hover:bg-gray-50" : "bg-red-50/60 hover:bg-red-50"}>
                <td className="px-3 py-2 text-center text-gray-400">{row.index}</td>
                {columns.map(c => {
                  const val = row.fields[c.key] ?? "";
                  const isImg = c.key.includes("image") && isUrl(val);
                  return (
                    <td key={c.key} className="px-3 py-2 max-w-[200px]">
                      {isImg ? (
                        <img src={val} alt="" className="h-8 w-12 rounded object-contain border border-gray-200 bg-gray-50"
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <span className={["block truncate", !val ? "text-gray-300 italic" : "text-gray-700"].join(" ")} title={val || "—"}>
                          {val || "—"}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-center">
                  {row.valid
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                    : <span title={row.errors.join("\n")}><AlertCircle className="w-4 h-4 text-red-400 mx-auto cursor-help" /></span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {invalid > 0 && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 space-y-1 max-h-28 overflow-y-auto">
          {rows.filter(r => !r.valid).map(r => (
            <p key={r.index} className="text-xs text-red-500">
              <span className="font-bold">Dòng {r.index}:</span> {r.errors.join(", ")}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main generic modal ───────────────────────────────────────────────────────
export default function ExcelImportModal({
  title, subtitle, columns, sheetName, templateUrl,
  validateRow, onSubmit, onClose, onDone,
}: ExcelImportModalProps) {

  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep]         = useState<Step>("upload");
  const [file, setFile]         = useState<File | null>(null);
  const [rows, setRows]         = useState<ParsedRow[]>([]);
  const [parseErr, setParseErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]     = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((f: File) => {
    setParseErr(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const sheet = findSheet(wb, sheetName);
        if (!sheet) {
          setParseErr(`Không tìm thấy sheet "${sheetName}". Có trong file: ${wb.SheetNames.join(", ")}`);
          return;
        }
        const parsed = parseSheet(sheet, columns, validateRow);
        if (parsed.length === 0) {
          setParseErr("File không có dữ liệu (dữ liệu bắt đầu từ dòng 3).");
          return;
        }
        setFile(f);
        setRows(parsed);
        setStep("preview");
      } catch (err: unknown) {
        setParseErr(`Không thể đọc file: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    reader.onerror = () => setParseErr("Lỗi khi đọc file.");
    reader.readAsArrayBuffer(f);
  }, [sheetName, columns, validateRow]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = "";
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files?.[0]; if (f) handleFile(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setSubmitting(true);
    try {
      const res = await onSubmit(file);
      setResult(res);
      setStep("result");
      if (res.imported > 0) onDone?.();
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => { setStep("upload"); setFile(null); setRows([]); setParseErr(null); setResult(null); };

  const validCount   = rows.filter(r => r.valid).length;
  const invalidCount = rows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900">{title}</h2>
              {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step bar */}
        <div className="px-6 pt-4 pb-2 shrink-0 border-b border-gray-50">
          <StepBar step={step} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Step 1 */}
          {step === "upload" && (
            <>
              {/* Template */}
              <div className="flex items-center justify-between rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-semibold text-gray-600">File template mẫu</p>
                    <p className="text-xs text-gray-400">
                      Bắt buộc: {columns.filter(c => c.required).map(c => c.label).join(", ")}
                    </p>
                  </div>
                </div>
                {templateUrl && (
                  <a href={templateUrl} download className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition">
                    <Download className="w-3.5 h-3.5" /> Template
                  </a>
                )}
              </div>

              {/* Format note */}
              <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-xs text-blue-700 space-y-0.5 leading-relaxed">
                <p className="font-bold mb-1">Định dạng file:</p>
                <p>• Dòng 1: header tên cột — <span className="font-semibold">bỏ qua</span></p>
                <p>• Dòng 2: mô tả / ví dụ  — <span className="font-semibold">bỏ qua</span></p>
                <p>• Dòng 3+: dữ liệu</p>
                <p>• Tên sheet: <span className="font-bold text-blue-900">{sheetName}</span> (hoặc 1 sheet duy nhất)</p>
              </div>

              {/* Drop zone */}
              <input ref={fileRef} type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                className="hidden" onChange={onFileChange} />
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={[
                  "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 cursor-pointer transition select-none",
                  dragOver ? "border-orange-400 bg-orange-50" : "border-gray-200 bg-gray-50 hover:border-orange-300 hover:bg-orange-50/50",
                ].join(" ")}
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                  <Upload className="w-6 h-6 text-gray-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-700">Kéo thả file vào đây</p>
                  <p className="text-xs text-gray-400 mt-0.5">hoặc <span className="text-orange-500 font-semibold">nhấn để chọn</span> · .xlsx · .xls</p>
                </div>
              </div>

              {parseErr && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{parseErr}</p>
                </div>
              )}
            </>
          )}

          {/* Step 2 */}
          {step === "preview" && (
            <>
              <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5">
                <FileSpreadsheet className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-sm font-semibold text-gray-700 truncate flex-1">{file?.name}</span>
                <button onClick={reset} className="text-xs text-gray-400 hover:text-red-500 transition font-semibold shrink-0">Đổi file</button>
              </div>

              <PreviewTable rows={rows} columns={columns} />

              {invalidCount > 0 && validCount === 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700 font-semibold">
                  Tất cả dòng đều có lỗi — kiểm tra lại file trước khi import.
                </div>
              )}
              {invalidCount > 0 && validCount > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                  <span className="font-bold">Lưu ý:</span> Sẽ bỏ qua {invalidCount} dòng lỗi, chỉ import {validCount} dòng hợp lệ.
                </div>
              )}
            </>
          )}

          {/* Step 3 */}
          {step === "result" && result && (
            <div className="space-y-4">
              {result.imported > 0 && (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-emerald-800">Import thành công</p>
                    <p className="text-xs text-emerald-600 mt-0.5">Đã lưu <span className="font-bold">{result.imported}</span> bản ghi.</p>
                  </div>
                </div>
              )}
              {result.errors.length > 0 && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-xs font-bold text-red-600">{result.errors.length} lỗi từ server:</p>
                  </div>
                  <ul className="space-y-1 max-h-40 overflow-y-auto ml-6">
                    {result.errors.map((e, i) => (
                      <li key={i} className="text-xs text-red-500 list-disc">{e}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.imported === 0 && result.errors.length === 0 && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-center text-sm text-gray-500">
                  Không có dữ liệu nào được import.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/60 shrink-0 rounded-b-3xl">
          {step === "upload" && (
            <>
              <span className="text-xs text-gray-400">Hỗ trợ .xlsx và .xls</span>
              <button onClick={onClose} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 transition">Hủy</button>
            </>
          )}
          {step === "preview" && (
            <>
              <button onClick={reset} className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 transition">
                <ArrowLeft className="w-4 h-4" /> Quay lại
              </button>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">{validCount} / {rows.length} dòng hợp lệ</span>
                <button
                  onClick={handleSubmit}
                  disabled={validCount === 0 || submitting}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 px-5 py-2 text-sm font-bold text-white transition"
                >
                  {submitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang import...</>
                    : <><ArrowRight className="w-4 h-4" /> Xác nhận Import</>
                  }
                </button>
              </div>
            </>
          )}
          {step === "result" && (
            <>
              <button onClick={reset} className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 transition">
                <Upload className="w-4 h-4" /> Import thêm
              </button>
              <button onClick={onClose} className="flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-5 py-2 text-sm font-bold text-white transition">
                <Eye className="w-4 h-4" /> Xem danh sách
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
