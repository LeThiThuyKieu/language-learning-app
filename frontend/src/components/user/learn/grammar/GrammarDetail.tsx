import { useEffect, useState } from "react";
import { grammarService, type GrammarTopic } from "@/services/grammarService";
import { Loader2, ChevronDown } from "lucide-react";

interface GrammarDetailProps {
  topic: GrammarTopic | null;
}

interface TenseItem {
  id: number;
  slug: string;
  title: string;
  description: string;
  sections: Section[];
}

interface Section {
  id: string;
  title: string;
  items?: SectionItem[];
  [key: string]: any;
}

interface SectionItem {
  title: string;
  description?: string;
  examples?: Example[];
}

interface Example {
  en: string;
  vi: string;
}

export default function GrammarDetail({ topic }: GrammarDetailProps) {
  const [tenses, setTenses] = useState<TenseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTenses, setExpandedTenses] = useState<Record<number, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Load tenses từ JSON
  useEffect(() => {
    if (!topic) {
      setTenses([]);
      setExpandedTenses({});
      setExpandedSections({});
      return;
    }

    const loadTenses = async () => {
      try {
        setLoading(true);
        const url = topic.jsonUrl.startsWith('/') 
          ? topic.jsonUrl 
          : `${window.location.origin}${topic.jsonUrl}`;
        
        const data = await grammarService.getGrammarTopicDetail(url);
        
        if (Array.isArray(data)) {
          setTenses(data);
        } else {
          setTenses([data]);
        }
        setExpandedTenses({});
        setExpandedSections({});
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load topics");
        console.error("Error loading grammar tenses:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTenses();
  }, [topic]);

  const toggleTense = (tenseId: number) => {
    setExpandedTenses((prev) => ({
      ...prev,
      [tenseId]: !prev[tenseId],
    }));
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        <p className="font-semibold">Lỗi</p>
        <p>{error}</p>
      </div>
    );
  }

  if (tenses.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 p-8 text-center">
        <p className="text-gray-600">Chọn một chuyên đề để xem chi tiết</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tenses.map((tense) => (
        <div key={tense.id} className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Cấp 1: Tense Title */}
          <button
            onClick={() => toggleTense(tense.id)}
            className="w-full flex items-center justify-between bg-white hover:bg-gray-50 px-4 py-3 transition font-semibold text-primary-700"
          >
            <div className="text-left">
              <p>{tense.title}</p>
              {tense.description && (
                <p className="text-sm font-normal text-primary-600 mt-1">{tense.description}</p>
              )}
            </div>
            <ChevronDown
              className={`h-5 w-5 shrink-0 transition-transform ${
                expandedTenses[tense.id] ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Cấp 2: Sections */}
          {expandedTenses[tense.id] && (
            <div className="bg-white divide-y">
              {tense.sections?.map((section) => (
                <div key={section.id} className="border-t border-gray-100">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between bg-white hover:bg-gray-50 px-4 py-3 transition font-semibold text-gray-700 border-t border-gray-200"
                  >
                    <span className="text-left">{section.title}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-transform ${
                        expandedSections[section.id] ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Cấp 3: Section Content */}
                  {expandedSections[section.id] && (
                    <div className="p-4 space-y-4 bg-white">
                      {section.items && (
                        <div className="space-y-3">
                          {section.items.map((item: SectionItem, idx: number) => (
                            <div key={idx} className="border-l-4 border-primary-300 pl-4">
                              <h5 className="font-semibold text-gray-900">{item.title}</h5>
                              {item.description && (
                                <p className="mt-1 text-gray-600 text-sm">{item.description}</p>
                              )}
                              {item.examples && item.examples.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  {item.examples.map((example: Example, exIdx: number) => (
                                    <div key={exIdx} className="bg-white border border-gray-200 p-3 rounded">
                                      <p className="text-sm font-medium text-gray-900">
                                        {example.en}
                                      </p>
                                      <p className="text-sm text-gray-600 mt-1">
                                        {example.vi}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Render other properties */}
                      {Object.entries(section).map(([key, value]) => {
                        if (['id', 'title', 'items'].includes(key)) return null;
                        
                        if (key === 'examples' && Array.isArray(value) && value.length > 0) {
                          return (
                            <div key={key} className="space-y-2 border-t pt-4">
                              <h5 className="font-semibold text-gray-900">Ví dụ</h5>
                              {value.map((example: Example, idx: number) => (
                                <div key={idx} className="bg-white border border-gray-200 p-3 rounded">
                                  <p className="text-sm font-medium text-gray-900">
                                    {example.en}
                                  </p>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {example.vi}
                                  </p>
                                </div>
                              ))}
                            </div>
                          );
                        }

                        if (key === 'positive' || key === 'negative' || key === 'question') {
                          return Array.isArray(value) && value.length > 0 ? (
                            <div key={key} className="space-y-2 border-t pt-4">
                              <h5 className="font-semibold text-gray-900 capitalize">
                                {key === 'positive' ? 'Khẳng định' : key === 'negative' ? 'Phủ định' : 'Câu hỏi'}
                              </h5>
                              {value.map((item: any, idx: number) => (
                                <div key={idx} className="bg-white border border-gray-200 p-3 rounded">
                                  <p className="text-sm font-mono font-bold text-primary-600">
                                    {item.formula}
                                  </p>
                                  {item.type && (
                                    <p className="text-xs text-gray-600 mt-1">{item.type}</p>
                                  )}
                                  {item.note && (
                                    <p className="text-xs text-gray-600 mt-1">{item.note}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : null;
                        }

                        if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
                          return (
                            <div key={key} className="space-y-2 border-t pt-4">
                              <h5 className="font-semibold text-gray-900 capitalize">
                                {key.replace(/_/g, ' ')}
                              </h5>
                              {value.map((item: any, idx: number) => (
                                <div key={idx} className="bg-white border border-gray-200 p-3 rounded">
                                  {typeof item === 'string' ? (
                                    <p className="text-sm text-gray-900">{item}</p>
                                  ) : (
                                    <div className="text-sm space-y-1">
                                      {Object.entries(item).map(([k, v]) => (
                                        <p key={k} className="text-gray-900">
                                          <span className="font-semibold">{k}:</span> {String(v)}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        }

                        if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
                          return (
                            <div key={key} className="space-y-2 border-t pt-4">
                              <h5 className="font-semibold text-gray-900 capitalize">
                                {key.replace(/_/g, ' ')}
                              </h5>
                              <ul className="list-disc list-inside space-y-1">
                                {value.map((item: string, idx: number) => (
                                  <li key={idx} className="text-sm text-gray-700">{item}</li>
                                ))}
                              </ul>
                            </div>
                          );
                        }

                        return null;
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
