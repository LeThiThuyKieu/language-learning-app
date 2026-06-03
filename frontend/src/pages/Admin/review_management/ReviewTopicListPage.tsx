import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, Link } from "react-router-dom";
import { BookOpen, Eye, Mic, PenLine, PencilLine, PlusCircle, Puzzle, RotateCcw, Save, Speaker, X } from "lucide-react";
import toast from "react-hot-toast";

type TabKey = "Quiz" | "Listening" | "Speaking" | "Reading" | "Writing" | "Random Settings";

type ModuleType = Exclude<TabKey, "Random Settings">;

type ModuleCard = {
    id: number;
    title: string;
    description: string;
    meta: string;
    tag: string;
};

type CardForm = {
    title: string;
    description: string;
    meta: string;
    tag: string;
};

const initialModuleCards: Record<ModuleType, ModuleCard[]> = {
    Quiz: [
        { id: 1, title: "Quick Quiz 1", description: "Warm-up multiple choice set for the topic.", meta: "10 questions", tag: "Easy" },
        { id: 2, title: "Quick Quiz 2", description: "Short practice quiz focused on recall.", meta: "12 questions", tag: "Medium" },
        { id: 3, title: "Challenge Quiz", description: "Mixed question set for stronger recall.", meta: "15 questions", tag: "Hard" },
        { id: 4, title: "Create New Quiz", description: "Add a new quiz bundle for this topic.", meta: "Blank template", tag: "New" },
    ],
    Listening: [
        { id: 1, title: "Conversation Clip", description: "Listen and choose the correct response.", meta: "Audio 01", tag: "Listening" },
        { id: 2, title: "Scenario Audio", description: "Topic-based listening with 3 answer options.", meta: "Audio 02", tag: "Listening" },
        { id: 3, title: "Detail Check", description: "Find key details from a short conversation.", meta: "Audio 03", tag: "Listening" },
        { id: 4, title: "Create New Listening", description: "Add another audio practice set.", meta: "Blank template", tag: "New" },
    ],
    Speaking: [
        { id: 1, title: "Introduce Yourself", description: "Practice speaking with short guided prompts.", meta: "2 prompts", tag: "Speaking" },
        { id: 2, title: "Role Play", description: "Answer in a real-world conversation format.", meta: "3 prompts", tag: "Speaking" },
        { id: 3, title: "Describe the Image", description: "Describe what you see using topic vocabulary.", meta: "1 image", tag: "Speaking" },
        { id: 4, title: "Create New Speaking", description: "Add a new speaking exercise set.", meta: "Blank template", tag: "New" },
    ],
    Reading: [
        { id: 1, title: "Reading Bank 1", description: "Short passage with vocabulary checks.", meta: "5 articles", tag: "Reading" },
        { id: 2, title: "Reading Bank 2", description: "Longer text with understanding questions.", meta: "7 articles", tag: "Reading" },
        { id: 3, title: "Context Clues", description: "Practice reading for meaning in context.", meta: "4 articles", tag: "Reading" },
        { id: 4, title: "Create New Reading", description: "Add a reading set for this topic.", meta: "Blank template", tag: "New" },
    ],
    Writing: [
        { id: 1, title: "Sentence Builder", description: "Write sentences using the topic words.", meta: "8 tasks", tag: "Writing" },
        { id: 2, title: "Short Paragraph", description: "Compose a short response from a prompt.", meta: "5 tasks", tag: "Writing" },
        { id: 3, title: "Grammar Rewrite", description: "Rewrite lines to match the correct grammar.", meta: "6 tasks", tag: "Writing" },
        { id: 4, title: "Create New Writing", description: "Add a new writing practice pack.", meta: "Blank template", tag: "New" },
    ],
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
    const [moduleItems, setModuleItems] = useState<Record<ModuleType, ModuleCard[]>>(initialModuleCards);
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [cardModalMode, setCardModalMode] = useState<"add" | "edit" | "view">("view");
    const [cardModalTab, setCardModalTab] = useState<ModuleType>("Quiz");
    const [editingCardId, setEditingCardId] = useState<number | null>(null);
    const [cardForm, setCardForm] = useState<CardForm>({
        title: "",
        description: "",
        meta: "",
        tag: "New",
    });
    const [settings, setSettings] = useState({
        quizCount: "5",
        listeningSessions: "1",
        speakingSessions: "1",
        readingSessions: "1",
        writingSessions: "1",
    });

    const moduleIcons = {
        Quiz: Puzzle,
        Listening: Speaker,
        Speaking: Mic,
        Reading: BookOpen,
        Writing: PenLine,
    } as const;

    function openCardModal(tab: ModuleType, mode: "add" | "edit" | "view", card?: ModuleCard) {
        setCardModalTab(tab);
        setCardModalMode(mode);
        setEditingCardId(card?.id ?? null);
        setCardForm({
            title: card?.title ?? "",
            description: card?.description ?? "",
            meta: card?.meta ?? "",
            tag: card?.tag ?? (mode === "add" ? "New" : ""),
        });
        setIsCardModalOpen(true);
    }

    function closeCardModal() {
        setIsCardModalOpen(false);
        setEditingCardId(null);
    }

    function handleSaveCard() {
        const nextCard: ModuleCard = {
            id: editingCardId ?? Date.now(),
            title: cardForm.title.trim(),
            description: cardForm.description.trim(),
            meta: cardForm.meta.trim(),
            tag: cardForm.tag.trim() || "New",
        };

        setModuleItems((current) => {
            const currentCards = current[cardModalTab];
            const createCardIndex = currentCards.findIndex((item) => item.tag === "New" && item.title.toLowerCase().includes("create new"));
            const nextCards = editingCardId === null
                ? (() => {
                    const copy = [...currentCards];
                    const insertIndex = createCardIndex >= 0 ? createCardIndex : copy.length;
                    copy.splice(insertIndex, 0, nextCard);
                    return copy;
                })()
                : currentCards.map((item) => (item.id === editingCardId ? nextCard : item));

            return {
                ...current,
                [cardModalTab]: nextCards,
            };
        });

        toast.success(cardModalMode === "add" ? "Đã thêm bài mới" : "Đã lưu thay đổi bài");

        closeCardModal();
    }

    function handleSaveSettings() {
        toast.success("Đã lưu cấu hình random settings");
    }

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
                                <button type="button" onClick={handleSaveSettings} className="inline-flex items-center gap-2 rounded-lg bg-orange-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-800">
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
                        {moduleItems[activeTab as ModuleType].map((card, index) => {
                            const isCreateCard = index === moduleItems[activeTab as ModuleType].length - 1;
                            return (
                                <article
                                    key={`${activeTab}-${card.id}`}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => openCardModal(activeTab as ModuleType, isCreateCard ? "add" : "view", isCreateCard ? undefined : card)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            openCardModal(activeTab as ModuleType, isCreateCard ? "add" : "view", isCreateCard ? undefined : card);
                                        }
                                    }}
                                    className={`group cursor-pointer rounded-2xl border p-4 shadow-sm transition ${
                                        isCreateCard
                                            ? "border-dashed border-orange-200 bg-orange-50/40 hover:bg-orange-50"
                                            : "border-orange-100 bg-white hover:-translate-y-1 hover:shadow-md"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                                            {isCreateCard ? <PlusCircle className="h-5 w-5" /> : <Puzzle className="h-5 w-5" />}
                                        </div>
                                        <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-orange-700">
                                            {card.tag}
                                        </span>
                                    </div>

                                    <h3 className="mt-4 text-base font-extrabold text-slate-900">{card.title}</h3>
                                    <p className="mt-2 text-sm leading-6 text-slate-500">{card.description}</p>

                                    <div className="mt-4 flex items-center justify-between rounded-xl bg-orange-50/70 px-3 py-2 text-sm text-slate-700">
                                        <span className="font-semibold text-slate-500">{card.meta}</span>
                                        <div className="flex items-center gap-2">
                                            {!isCreateCard && (
                                                <button
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        openCardModal(activeTab as ModuleType, "edit", card);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-700 hover:text-orange-800"
                                                >
                                                    <PencilLine className="h-3.5 w-3.5" />
                                                    Edit
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    openCardModal(activeTab as ModuleType, isCreateCard ? "add" : "view", isCreateCard ? undefined : card);
                                                }}
                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-800"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                {isCreateCard ? "Create" : "View"}
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </div>
            )}

            {isCardModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
                        <div className="flex items-start justify-between px-7 pt-6 pb-4">
                            <div>
                                <h2 className="text-xl font-extrabold text-slate-900">
                                    {cardModalMode === "add" ? `Add ${cardModalTab} Item` : cardModalMode === "edit" ? `Edit ${cardModalTab} Item` : `View ${cardModalTab} Item`}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    {cardModalMode === "view"
                                        ? "Preview the selected lesson item."
                                        : "Use the same admin style to create or update a fake item locally."}
                                </p>
                            </div>
                            <button type="button" onClick={closeCardModal} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-5 px-7 pb-7">
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Title</label>
                                <input
                                    value={cardForm.title}
                                    disabled={cardModalMode === "view"}
                                    onChange={(event) => setCardForm((current) => ({ ...current, title: event.target.value }))}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-300 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Description</label>
                                <textarea
                                    value={cardForm.description}
                                    disabled={cardModalMode === "view"}
                                    onChange={(event) => setCardForm((current) => ({ ...current, description: event.target.value }))}
                                    className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-300 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Meta</label>
                                    <input
                                        value={cardForm.meta}
                                        disabled={cardModalMode === "view"}
                                        onChange={(event) => setCardForm((current) => ({ ...current, meta: event.target.value }))}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-300 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Tag</label>
                                    <input
                                        value={cardForm.tag}
                                        disabled={cardModalMode === "view"}
                                        onChange={(event) => setCardForm((current) => ({ ...current, tag: event.target.value }))}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-300 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50/60 px-4 py-3">
                                <div>
                                    <div className="text-xs font-bold uppercase tracking-wider text-orange-700">Current module</div>
                                    <div className="mt-1 text-sm font-semibold text-slate-800">{cardModalTab}</div>
                                </div>
                                <div className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-orange-100">{cardModalMode.toUpperCase()}</div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button type="button" onClick={closeCardModal} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">
                                    {cardModalMode === "view" ? "Close" : "Cancel"}
                                </button>
                                {cardModalMode !== "view" && (
                                    <button
                                        type="button"
                                        onClick={handleSaveCard}
                                        className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600"
                                    >
                                        <Save className="h-4 w-4" />
                                        {cardModalMode === "add" ? "Add Item" : "Save Changes"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
