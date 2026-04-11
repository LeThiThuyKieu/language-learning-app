import {CheckCircle2, XCircle} from "lucide-react";

type Props = {
    variant: "correct" | "incorrect";
    title: string;
    detail?: React.ReactNode;
    onContinue: () => void;
};

export default function LessonResultFooter({variant, title, detail, onContinue}: Props) {
    const isOk = variant === "correct";

    return (
        <div
            className={[
                "fixed bottom-0 left-0 right-0 z-20 border-t-2 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]",
                isOk
                    ? "border-emerald-300 bg-gradient-to-b from-emerald-50 to-emerald-100/90"
                    : "border-red-300 bg-gradient-to-b from-red-50 to-red-100/90",
            ].join(" ")}
        >
            <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-5 px-4 py-6 md:px-8 md:py-7">
                <div className="flex min-w-0 flex-1 items-start gap-4">
                    <div
                        className={[
                            "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl shadow-lg ring-4 ring-white",
                            isOk
                                ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white"
                                : "bg-gradient-to-br from-red-400 to-red-600 text-white",
                        ].join(" ")}
                        aria-hidden
                    >
                        {isOk ? (
                            <CheckCircle2 className="h-10 w-10" strokeWidth={2.5}/>
                        ) : (
                            <XCircle className="h-10 w-10" strokeWidth={2.5}/>
                        )}
                    </div>
                    <div className="min-w-0 pt-0.5">
                        <div
                            className={[
                                "text-lg font-extrabold md:text-xl",
                                isOk ? "text-emerald-900" : "text-red-900",
                            ].join(" ")}
                        >
                            {title}
                        </div>
                        {detail != null && detail !== false && (
                            <div
                                className={[
                                    "mt-1.5 text-sm font-medium leading-relaxed md:text-[15px]",
                                    isOk ? "text-emerald-800/90" : "text-red-800/95",
                                ].join(" ")}
                            >
                                {detail}
                            </div>
                        )}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onContinue}
                    className="min-w-[168px] rounded-2xl bg-primary-600 px-6 py-3.5 text-sm font-extrabold uppercase tracking-wide text-white shadow-md transition hover:bg-primary-700 hover:shadow-lg"
                >
                    Tiếp tục
                </button>
            </div>
        </div>
    );
}
