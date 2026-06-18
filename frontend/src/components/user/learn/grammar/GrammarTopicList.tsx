import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { grammarService, type GrammarTopic } from "@/services/grammarService";
import { Loader2 } from "lucide-react";

interface GrammarTopicListProps {
  onSelectTopic: (topic: GrammarTopic) => void;
}

export default function GrammarTopicList({ onSelectTopic }: GrammarTopicListProps) {
  const [topics, setTopics] = useState<GrammarTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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
    <div className="space-y-3">
      {topics.map((topic) => (
        <button
          key={topic.id}
          type="button"
          onClick={() => navigate(`/grammar/${encodeURIComponent(topic.slug.trim())}`)}
          className="w-full rounded-2xl border border-gray-200 bg-white p-5 text-left transition hover:border-primary-300 hover:bg-primary-50"
        >
          <div className="flex flex-col gap-2">
            <span className="text-lg font-semibold text-gray-900">
              {topic.slug?.trim().replace(/-/g, " ")} - {topic.name}
            </span>
            {topic.jsonUrl && (
              <span className="text-sm text-gray-500">JSON: {topic.jsonUrl}</span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
