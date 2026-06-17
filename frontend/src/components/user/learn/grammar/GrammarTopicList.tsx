import { useEffect, useState } from "react";
import { grammarService, type GrammarTopic } from "@/services/grammarService";
import GrammarDetail from "./GrammarDetail";
import { Loader2, ChevronDown } from "lucide-react";

interface GrammarTopicListProps {
  onSelectTopic: (topic: GrammarTopic) => void;
  selectedTopicId?: number;
}

export default function GrammarTopicList({
  onSelectTopic,
  selectedTopicId,
}: GrammarTopicListProps) {
  const [topics, setTopics] = useState<GrammarTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<GrammarTopic | null>(null);

  useEffect(() => {
    const loadTopics = async () => {
      try {
        setLoading(true);
        const data = await grammarService.getGrammarTopics();
        setTopics(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load topics");
        console.error("Error loading grammar topics:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTopics();
  }, []);

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

  if (topics.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 p-8 text-center">
        <p className="text-gray-600">Không có chuyên đề ngữ pháp nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {topics.map((topic) => (
        <div key={topic.id}>
          <button
            onClick={() => {
              setSelectedTopic(selectedTopic?.id === topic.id ? null : topic);
              onSelectTopic(selectedTopic?.id === topic.id ? null : topic);
            }}
            className={`w-full rounded-xl border-2 p-4 text-left transition ${
              selectedTopic?.id === topic.id
                ? "border-primary-300 bg-white"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <h3
                className={`font-semibold ${
                  selectedTopic?.id === topic.id
                    ? "text-primary-700"
                    : "text-gray-700"
                }`}
              >
                {topic.name}
              </h3>
              <ChevronDown
                className={`h-5 w-5 shrink-0 transition-transform ${
                  selectedTopic?.id === topic.id
                    ? "rotate-180 text-primary-500"
                    : "text-gray-400"
                }`}
              />
            </div>
          </button>

          {/* Inline Detail Dropdown */}
          {selectedTopic?.id === topic.id && (
            <div className="mt-2 rounded-lg border border-primary-200 bg-white p-6">
              <GrammarDetail topic={selectedTopic} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
