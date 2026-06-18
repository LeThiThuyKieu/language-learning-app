import { useNavigate } from "react-router-dom";
import { grammarService, type GrammarTopic } from "@/services/grammarService.ts";
import { useEffect, useState } from "react";
import { BookOpen, ChevronRight, Loader2 } from "lucide-react";

/** Convert slug → Title Case English name. e.g. "verb-tenses" → "Verb Tenses" */
function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function TopicCard({ topic }: { topic: GrammarTopic; index: number }) {
  const navigate = useNavigate();
  const enName = slugToTitle(topic.slug.trim());

  return (
    <button
      type="button"
      onClick={() => navigate(`/grammar/${topic.slug.trim()}`)}
      className="font-inter group flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md w-full"
    >
      {/* Hàng 1: Icon + Names — cách nhau bằng gap */}
      <div className="flex flex-row items-center gap-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50">
          <BookOpen className="h-6 w-6 text-primary-600" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold leading-snug text-gray-900">{enName}</p>
          <p className="mt-0.5 text-sm text-gray-500">{topic.name}</p>
        </div>
      </div>

      {/* Hàng 2: CTA căn phải */}
      <div className="flex justify-end items-center gap-1 text-xs font-semibold uppercase tracking-widest text-primary-600 transition group-hover:gap-2">
        <span>Học ngay</span>
        <ChevronRight className="h-3.5 w-3.5" />
      </div>
    </button>
  );
}

export default function GrammarTopicListPage() {
  const [topics, setTopics] = useState<GrammarTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTopics = async () => {
      try {
        setLoading(true);
        const data = await grammarService.getGrammarTopics();
        data.sort((a, b) => a.displayOrder - b.displayOrder);
        setTopics(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được danh sách chuyên đề");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadTopics();
  }, []);

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

  return (
    <div className="font-inter space-y-6">
      {/* Header — căn giữa, style giống trang phát âm */}
      <div className="text-center pt-6 mb-8">
        <h1 className="text-3xl font-black text-primary-600">
          Cùng học ngữ pháp tiếng Anh!
        </h1>
        <p className="mt-2 text-base text-gray-500">
          Nắm vững cấu trúc ngữ pháp từ cơ bản đến nâng cao với {topics.length} chuyên đề
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((topic, i) => (
          <TopicCard key={topic.slug} topic={topic} index={i} />
        ))}
      </div>
    </div>
  );
}
