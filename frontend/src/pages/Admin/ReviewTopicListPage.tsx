import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { BookOpen, Mic, PenLine, Puzzle, RotateCcw, Save, Search, Speaker } from "lucide-react";

type TabKey = "Quiz" | "Listening" | "Speaking" | "Reading" | "Writing" | "Random Settings";

type ModuleCard = {
    title: string;
    description: string;
    meta: string;
    tag: string;
};

export default function ReviewTopicListPage() {
    const { id } = useParams<{ id: string }>();
    const topicName = useMemo(() => {
        const topicMap: Record<string, string> = {
            "1": "Travel",
            "2": "Food",
            "3": "Business",
            "4": "Shopping",
            "5": "Technology",
        };

        return topicMap[id ?? ""] ?? "Topic";
    }, [id]);

    const tabs: TabKey[] = ["Quiz", "Listening", "Speaking", "Reading", "Writing", "Random Settings"];
    const [activeTab, setActiveTab] = useState<TabKey>("Random Settings");
    const [settings, setSettings] = useState({
        quizCount: "5",
        listeningSessions: "1",
        speakingSessions: "1",
        readingSessions: "1",
        writingSessions: "1",
    });

    const moduleCards: Record<Exclude<TabKey, "Random Settings">, ModuleCard[]> = {
        Quiz: [
            { title: "Quick Quiz 1", description: "Warm-up multiple choice set for the topic.", meta: "10 questions", tag: "Easy" },
            { title: "Quick Quiz 2", description: "Short practice quiz focused on recall.", meta: "12 questions", tag: "Medium" },
            { title: "Challenge Quiz", description: "Mixed question set for stronger recall.", meta: "15 questions", tag: "Hard" },
            { title: "Create New Quiz", description: "Add a new quiz bundle for this topic.", meta: "Blank template", tag: "New" },
        ],
        Listening: [
            { title: "Conversation Clip", description: "Listen and choose the correct response.", meta: "Audio 01", tag: "Listening" },
            { title: "Scenario Audio", description: "Topic-based listening with 3 answer options.", meta: "Audio 02", tag: "Listening" },
            { title: "Detail Check", description: "Find key details from a short conversation.", meta: "Audio 03", tag: "Listening" },
            { title: "Create New Listening", description: "Add another audio practice set.", meta: "Blank template", tag: "New" },
        ],
        Speaking: [
            { title: "Introduce Yourself", description: "Practice speaking with short guided prompts.", meta: "2 prompts", tag: "Speaking" },
            { title: "Role Play", description: "Answer in a real-world conversation format.", meta: "3 prompts", tag: "Speaking" },
            { title: "Describe the Image", description: "Describe what you see using topic vocabulary.", meta: "1 image", tag: "Speaking" },
            { title: "Create New Speaking", description: "Add a new speaking exercise set.", meta: "Blank template", tag: "New" },
        ],
        Reading: [
            { title: "Reading Bank 1", description: "Short passage with vocabulary checks.", meta: "5 articles", tag: "Reading" },
            { title: "Reading Bank 2", description: "Longer text with understanding questions.", meta: "7 articles", tag: "Reading" },
            { title: "Context Clues", description: "Practice reading for meaning in context.", meta: "4 articles", tag: "Reading" },
            { title: "Create New Reading", description: "Add a reading set for this topic.", meta: "Blank template", tag: "New" },
        ],
        Writing: [
            { title: "Sentence Builder", description: "Write sentences using the topic words.", meta: "8 tasks", tag: "Writing" },
            { title: "Short Paragraph", description: "Compose a short response from a prompt.", meta: "5 tasks", tag: "Writing" },
            { title: "Grammar Rewrite", description: "Rewrite lines to match the correct grammar.", meta: "6 tasks", tag: "Writing" },
            { title: "Create New Writing", description: "Add a new writing practice pack.", meta: "Blank template", tag: "New" },
        ],
    };

    const moduleIcons = {
        Quiz: Puzzle,
        Listening: Speaker,
        Speaking: Mic,
        Reading: BookOpen,
        Writing: PenLine,
    } as const;

    function resetDefault() {
        setSettings({
            quizCount: "5",
            listeningSessions: "1",
            speakingSessions: "1",
            readingSessions: "1",
            writingSessions: "1",
        });
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <nav className="mb-2 text-sm text-slate-400">
                    <Link to="/admin/review-topics" className="hover:text-slate-600">Review</Link>
                    <span className="mx-2">&gt;</span>
                    <span className="text-slate-700">{topicName}</span>
                </nav>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{topicName} Review</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Configure your randomized learning path and review sessions for the {topicName.toLowerCase()} vocabulary and grammar module.
                </p>
            </div>

            <div className="mb-5 flex flex-wrap gap-6 border-b border-orange-100 text-sm font-semibold text-slate-500">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`relative pb-3 transition ${activeTab === tab ? "text-orange-600" : "hover:text-slate-800"}`}
                    >
                        {tab}
                        {activeTab === tab && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-orange-500" />}
                    </button>
                ))}
            </div>

            {activeTab === "Random Settings" ? (
                <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm sm:p-6">
                    <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-6">
                        <div className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-800">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                                <span className="text-sm">≋</span>
                            </span>
                            Review Configuration
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-500">Quiz count</label>
                                <input
                                    value={settings.quizCount}
                                    onChange={(event) => setSettings((current) => ({ ...current, quizCount: event.target.value }))}
                                    className="w-full rounded-xl border border-orange-100 bg-orange-50/50 px-4 py-3 text-sm outline-none focus:border-orange-300 focus:bg-white"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-500">Listening sessions</label>
                                <input
                                    value={settings.listeningSessions}
                                    onChange={(event) => setSettings((current) => ({ ...current, listeningSessions: event.target.value }))}
                                    className="w-full rounded-xl border border-orange-100 bg-orange-50/50 px-4 py-3 text-sm outline-none focus:border-orange-300 focus:bg-white"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-500">Speaking sessions</label>
                                <input
                                    value={settings.speakingSessions}
                                    onChange={(event) => setSettings((current) => ({ ...current, speakingSessions: event.target.value }))}
                                    className="w-full rounded-xl border border-orange-100 bg-orange-50/50 px-4 py-3 text-sm outline-none focus:border-orange-300 focus:bg-white"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-500">Reading sessions</label>
                                <input
                                    value={settings.readingSessions}
                                    onChange={(event) => setSettings((current) => ({ ...current, readingSessions: event.target.value }))}
                                    className="w-full rounded-xl border border-orange-100 bg-orange-50/50 px-4 py-3 text-sm outline-none focus:border-orange-300 focus:bg-white"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-500">Writing sessions</label>
                                <input
                                    value={settings.writingSessions}
                                    onChange={(event) => setSettings((current) => ({ ...current, writingSessions: event.target.value }))}
                                    className="w-full rounded-xl border border-orange-100 bg-orange-50/50 px-4 py-3 text-sm outline-none focus:border-orange-300 focus:bg-white"
                                />
                            </div>

                        </div>

                        <div className="mt-6 border-t border-orange-100 pt-5">
                            <div className="flex flex-wrap items-center gap-3">
                                <button className="inline-flex items-center gap-2 rounded-lg bg-orange-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-800">
                                    <Save className="h-4 w-4" />
                                    Save Configuration
                                </button>
                                <button
                                    type="button"
                                    onClick={resetDefault}
                                    className="inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-orange-50"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    Reset default
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm sm:p-6">
                    <div className="mb-5 flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-extrabold text-slate-900">{activeTab} Module</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Fake content for the {activeTab.toLowerCase()} tab. Replace these cards with real items later.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-700">
                            {(() => {
                                const Icon = moduleIcons[activeTab as Exclude<TabKey, "Random Settings">];
                                return <Icon className="h-3.5 w-3.5" />;
                            })()}
                            {activeTab}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {moduleCards[activeTab as Exclude<TabKey, "Random Settings">].map((card, index) => {
                            const isCreateCard = index === 3;
                            return (
                                <article
                                    key={`${activeTab}-${card.title}`}
                                    className={`group rounded-2xl border p-4 shadow-sm transition ${
                                        isCreateCard
                                            ? "border-dashed border-orange-200 bg-orange-50/40 hover:bg-orange-50"
                                            : "border-orange-100 bg-white hover:-translate-y-1 hover:shadow-md"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                                            {isCreateCard ? <Search className="h-5 w-5" /> : <Puzzle className="h-5 w-5" />}
                                        </div>
                                        <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-orange-700">
                                            {card.tag}
                                        </span>
                                    </div>

                                    <h3 className="mt-4 text-base font-extrabold text-slate-900">{card.title}</h3>
                                    <p className="mt-2 text-sm leading-6 text-slate-500">{card.description}</p>

                                    <div className="mt-4 flex items-center justify-between rounded-xl bg-orange-50/70 px-3 py-2 text-sm text-slate-700">
                                        <span className="font-semibold text-slate-500">{card.meta}</span>
                                        <button type="button" className="text-xs font-bold text-orange-700 hover:text-orange-800">
                                            {isCreateCard ? "Create" : "Manage"}
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
