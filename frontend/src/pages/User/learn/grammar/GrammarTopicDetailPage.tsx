import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { grammarService, type GrammarTopic } from "@/services/grammarService.ts";
import {
  Loader2,
  ChevronLeft,
  ChevronDown,
  BookOpen,
  Tag,
  Zap,
  AlignLeft,
  Table2,
} from "lucide-react";

interface Example {
  en: string;
  vi: string;
}

interface FormulaRow {
  type?: string;
  formula?: string;
  formulas?: string[];
  note?: string;
  notes?: string[];
  examples?: Example[];
  rule?: string;
  structure?: string;
  meaning?: string;
}

interface TableRow {
  [key: string]: string;
}

interface SectionItem {
  // Usage items
  title?: string;
  description?: string;
  examples?: Example[];
  words?: string[];
  // Rule-style items (tag-questions, articles, conditional-sentences)
  rule?: string;
  example?: Example;
  // Adjective-order style
  order?: number;
  type?: string;
  meaning?: string;
  // Conjunction paired items
  structure?: string;
  note?: string;
  formula?: string;
  formulas?: string[];
  notes?: string[];
  [key: string]: any;
}

interface Section {
  id: string;
  title: string;
  description?: string;
  // Arrays of items
  items?: SectionItem[];
  // Formula groups
  positive?: FormulaRow[];
  negative?: FormulaRow[];
  question?: FormulaRow[];
  // Examples
  examples?: Example[];
  general_examples?: Example[];
  // Keywords
  keywords?: string[];
  verbs_context?: string[];
  // String lists
  formulas?: string[];
  transformation_rules?: string[];
  notes?: string[];
  transformation_note?: string;
  // Table
  table_data?: TableRow[];
  // Adjective order mnemonic
  formula_mnemonic?: string;
  // Tag-questions general composition
  general_composition?: {
    description?: string;
    examples?: Example[];
  };
  [key: string]: any;
}

interface TenseItem {
  id: number;
  slug: string;
  title: string;
  description?: string;
  sections?: Section[];
}

function ExampleBlock({ examples }: { examples: Example[] }) {
  if (!examples?.length) return null;
  return (
    <div className="mt-2 space-y-2">
      {examples.map((ex, i) => (
        <div key={i} className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-sm font-medium text-gray-900">{ex.en}</p>
          {ex.vi && <p className="mt-0.5 text-sm italic text-gray-500">{ex.vi}</p>}
        </div>
      ))}
    </div>
  );
}

function FormulaBox({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-primary-100 bg-primary-50 px-4 py-2.5">
      <p className="font-mono text-sm font-bold text-primary-700">{text}</p>
    </div>
  );
}

function FormulaGroupBlock({
  label,
  rows,
  color,
}: {
  label: string;
  rows: FormulaRow[];
  color: string;
}) {
  if (!rows?.length) return null;
  return (
    <div>
      <p className={`mb-2 text-xs font-semibold uppercase tracking-widest ${color}`}>{label}</p>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            {row.formula && (
              <p className="font-mono text-sm font-bold text-primary-700">{row.formula}</p>
            )}
            {row.formulas?.map((f, fi) => (
              <p key={fi} className="font-mono text-sm font-bold text-primary-700">{f}</p>
            ))}
            {row.type && <p className="mt-1 text-xs text-gray-500">{row.type}</p>}
            {row.note && <p className="mt-1 text-xs text-amber-600">{row.note}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function KeywordsBlock({ keywords, extra }: { keywords: string[]; extra?: string[] }) {
  const all = [...(keywords ?? []), ...(extra ?? [])];
  if (!all.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {all.map((kw, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
        >
          <Tag className="h-3 w-3 shrink-0" />
          {kw}
        </span>
      ))}
    </div>
  );
}

function NumberedList({ items }: { items: string[] }) {
  if (!items?.length) return null;
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-sm text-gray-700">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
            {i + 1}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function TableBlock({ rows }: { rows: TableRow[] }) {
  if (!rows?.length) return null;
  const keys = Object.keys(rows[0]);
  const headers: Record<string, string> = {
    conjunction: "Liên từ",
    usage: "Cách dùng",
    example: "Ví dụ",
    type: "Loại",
    formula: "Công thức",
  };
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {keys.map((k) => (
              <th
                key={k}
                className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                {headers[k] ?? k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {keys.map((k) => (
                <td key={k} className="px-4 py-3 align-top text-gray-700">
                  {k === "conjunction" ? (
                    <span className="font-mono font-semibold text-primary-700">{row[k]}</span>
                  ) : (
                    <span>{row[k]}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionItemCard({ item }: { item: SectionItem }) {
  const hasHeader = item.title || item.type || item.structure || item.rule || item.order;

  // Adjective-order table row (has order/type/meaning/examples as word list)
  if (item.order !== undefined && item.type) {
    return (
      <div className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
          {item.order}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900">
            {item.type}
            {item.meaning && (
              <span className="ml-2 text-sm font-normal text-gray-500">— {item.meaning}</span>
            )}
          </p>
          {item.examples && item.examples.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {(item.examples as unknown as string[]).map((ex, ei) => (
                <span
                  key={ei}
                  className="rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs text-gray-600"
                >
                  {ex}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      {/* Header */}
      {item.title && <h5 className="font-semibold text-gray-900">{item.title}</h5>}

      {item.rule && (
        <p className="font-medium text-gray-900">{item.rule}</p>
      )}

      {/* Structure + meaning (conjunction paired items) */}
      {item.structure && (
        <p className="font-semibold text-primary-700">{item.structure}</p>
      )}
      {item.meaning && !item.order && (
        <p className="mt-0.5 text-sm text-gray-500 italic">{item.meaning}</p>
      )}

      {/* Type (if not already shown as header via item.order) */}
      {item.type && !item.order && !item.structure && (
        <p className="font-semibold text-gray-900">{item.type}</p>
      )}

      {/* Description */}
      {item.description && (
        <p className={`text-sm leading-relaxed text-gray-600 ${hasHeader ? "mt-1" : ""}`}>
          {item.description}
        </p>
      )}

      {/* Note */}
      {item.note && (
        <p className="mt-1.5 rounded-lg border border-amber-100 bg-amber-50 px-3 py-1.5 text-sm text-amber-700">
          💡 {item.note}
        </p>
      )}

      {/* Notes array */}
      {item.notes && item.notes.map((n: string, ni: number) => (
        <p key={ni} className="mt-1.5 rounded-lg border border-amber-100 bg-amber-50 px-3 py-1.5 text-sm text-amber-700">
          💡 {n}
        </p>
      ))}

      {/* Single formula */}
      {item.formula && (
        <div className="mt-2">
          <FormulaBox text={item.formula} />
        </div>
      )}

      {/* Multiple formulas */}
      {item.formulas && item.formulas.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {item.formulas.map((f: string, fi: number) => (
            <FormulaBox key={fi} text={f} />
          ))}
        </div>
      )}

      {/* Words list (conjunction types) */}
      {item.words && item.words.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {item.words.map((w: string, wi: number) => (
            <span
              key={wi}
              className="rounded-full border border-primary-100 bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700"
            >
              {w}
            </span>
          ))}
        </div>
      )}

      {/* Single example (rule + example pattern) */}
      {item.example && <ExampleBlock examples={[item.example]} />}

          {item.examples && Array.isArray(item.examples) && item.examples.length > 0
            && typeof (item.examples as any[])[0] !== "string"
            && !item.order
            && <ExampleBlock examples={item.examples as Example[]} />}
    </div>
  );
}

function SectionContent({ section }: { section: Section }) {
  return (
    <div className="space-y-5 px-5 pb-5 pt-4">
      {/* Section-level description */}
      {section.description && (
        <p className="text-sm leading-relaxed text-gray-600">{section.description}</p>
      )}

      {/* Adjective-order mnemonic */}
      {section.formula_mnemonic && (
        <div className="flex items-center gap-3 rounded-2xl border border-primary-200 bg-primary-50 px-5 py-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary-500">
            Ghi nhớ
          </span>
          <span className="font-mono text-xl font-bold text-primary-700">
            {section.formula_mnemonic}
          </span>
        </div>
      )}

      {/* Tag-questions: general_composition block */}
      {section.general_composition && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          {section.general_composition.description && (
            <p className="text-sm leading-relaxed text-gray-700">
              {section.general_composition.description}
            </p>
          )}
          {section.general_composition.examples && (
            <ExampleBlock examples={section.general_composition.examples} />
          )}
        </div>
      )}

      {/* Items */}
      {section.items && section.items.length > 0 && (
        <div className="space-y-3">
          {section.items.map((item, idx) =>
            typeof item === "string" ? (
              // plain string item (rules list)
              <div key={idx} className="flex gap-2.5 text-sm text-gray-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                  {idx + 1}
                </span>
                <span>{item}</span>
              </div>
            ) : (
              <SectionItemCard key={idx} item={item} />
            )
          )}
        </div>
      )}

      {/* Formulas: positive / negative / question */}
      {(section.positive || section.negative || section.question) && (() => {
        const groups = [
          section.positive && { label: "Khẳng định", rows: section.positive, color: "text-green-600" },
          section.negative && { label: "Phủ định", rows: section.negative, color: "text-red-600" },
          section.question && { label: "Câu hỏi", rows: section.question, color: "text-blue-600" },
        ].filter(Boolean) as { label: string; rows: FormulaRow[]; color: string }[];

        const colClass =
          groups.length === 1 ? "grid-cols-1" :
          groups.length === 2 ? "grid-cols-1 sm:grid-cols-2" :
          "grid-cols-1 sm:grid-cols-3";

        return (
          <div className={`grid gap-4 ${colClass}`}>
            {groups.map((g) => (
              <FormulaGroupBlock key={g.label} label={g.label} rows={g.rows} color={g.color} />
            ))}
          </div>
        );
      })()}

      {/* Section-level examples (not duplicated if already inside items) */}
      {section.examples && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
            Ví dụ
          </p>
          <ExampleBlock examples={section.examples} />
        </div>
      )}

      {/* General examples (adjective-order) */}
      {section.general_examples && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
            Ví dụ tổng hợp
          </p>
          <ExampleBlock examples={section.general_examples} />
        </div>
      )}

      {/* Keywords / signals */}
      {(section.keywords || section.verbs_context) && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-green-600">
            <Zap className="h-3.5 w-3.5" />
            Dấu hiệu nhận biết
          </p>
          <KeywordsBlock
            keywords={section.keywords ?? []}
            extra={section.verbs_context}
          />
        </div>
      )}

      {/* String formula list */}
      {section.formulas && section.formulas.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary-600">
            <AlignLeft className="h-3.5 w-3.5" />
            Công thức
          </p>
          <div className="space-y-1.5">
            {section.formulas.map((f, fi) => (
              <FormulaBox key={fi} text={f} />
            ))}
          </div>
        </div>
      )}

      {/* Transformation rules */}
      {section.transformation_rules && section.transformation_rules.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-600">
            Quy tắc chuyển đổi
          </p>
          <NumberedList items={section.transformation_rules} />
        </div>
      )}

      {/* Single transformation note */}
      {section.transformation_note && (
        <p className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          💡 {section.transformation_note}
        </p>
      )}

      {/* Notes array */}
      {section.notes && section.notes.length > 0 && (
        <div className="space-y-2">
          {section.notes.map((n, ni) => (
            <p
              key={ni}
              className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700"
            >
              💡 {n}
            </p>
          ))}
        </div>
      )}

      {/* Table */}
      {section.table_data && section.table_data.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-500">
            <Table2 className="h-3.5 w-3.5" />
            Bảng tổng hợp
          </p>
          <TableBlock rows={section.table_data} />
        </div>
      )}
    </div>
  );
}

function TenseAccordion({ tense, defaultOpen }: { tense: TenseItem; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    tense.sections?.forEach((s) => {
      init[s.id] = true;
    });
    return init;
  });

  const toggleSection = (id: string) =>
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition hover:bg-gray-50"
      >
        <div className="flex gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-sm font-bold text-primary-700">
            {tense.id}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{tense.title}</p>
            {tense.description && (
              <p className="mt-0.5 text-sm text-gray-500">{tense.description}</p>
            )}
          </div>
        </div>
        <ChevronDown
          className={`mt-1 h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="divide-y divide-gray-100 border-t border-gray-100">
          {tense.sections?.map((section) => (
            <div key={section.id}>
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="flex w-full items-center justify-between gap-2 bg-gray-50 px-5 py-3 text-left transition hover:bg-gray-100"
              >
                <span className="text-sm font-semibold text-gray-800">{section.title}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${
                    openSections[section.id] ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openSections[section.id] && <SectionContent section={section} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SingleTopicSections({ sections }: { sections: Section[] }) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    sections.forEach((s) => {
      init[s.id] = true;
    });
    return init;
  });

  const toggle = (id: string) =>
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="divide-y divide-gray-100">
      {sections.map((section) => (
        <div key={section.id}>
          <button
            type="button"
            onClick={() => toggle(section.id)}
            className="flex w-full items-center justify-between gap-2 bg-gray-50 px-5 py-3 text-left transition hover:bg-gray-100"
          >
            <span className="text-sm font-semibold text-gray-800">{section.title}</span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${
                openSections[section.id] ? "rotate-180" : ""
              }`}
            />
          </button>
          {openSections[section.id] && <SectionContent section={section} />}
        </div>
      ))}
    </div>
  );
}

export default function GrammarTopicDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<GrammarTopic | null>(null);
  const [tenses, setTenses] = useState<TenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const topics = await grammarService.getGrammarTopics();
        const found = topics.find((t) => t.slug.trim() === slug.trim());
        if (!found) {
          setError("Không tìm thấy chuyên đề này");
          return;
        }
        setTopic(found);
        const url = found.jsonUrl.startsWith("/")
          ? found.jsonUrl
          : `${window.location.origin}${found.jsonUrl}`;
        const data = await grammarService.getGrammarTopicDetail(url);
        setTenses(Array.isArray(data) ? data : [data]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được nội dung");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 p-6 text-sm text-red-700">
        <p className="font-semibold">Lỗi</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!topic) return null;

  const isSingle = tenses.length === 1;

  return (
    <div className="font-inter space-y-5">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate("/grammar")}
        className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-primary-300 hover:bg-primary-50"
      >
        <ChevronLeft className="h-4 w-4" />
        Danh sách chuyên đề
      </button>

      {/* Hero header */}
      <div className="rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 to-white p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
            <BookOpen className="h-7 w-7 text-primary-600" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary-400">
              Grammar
            </p>
            <h1 className="text-2xl font-bold text-gray-900">{topic.name}</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {isSingle ? "1 chủ điểm" : `${tenses.length} chủ điểm`}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      {isSingle ? (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <p className="font-semibold text-gray-900">{tenses[0].title}</p>
            {tenses[0].description && (
              <p className="mt-1 text-sm text-gray-500">{tenses[0].description}</p>
            )}
          </div>
          <SingleTopicSections sections={tenses[0].sections ?? []} />
        </div>
      ) : (
        <div className="space-y-3">
          {tenses.map((tense, i) => (
            <TenseAccordion key={tense.id} tense={tense} defaultOpen={i === 0} />
          ))}
        </div>
      )}
    </div>
  );
}
