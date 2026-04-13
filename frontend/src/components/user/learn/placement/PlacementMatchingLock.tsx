import {useEffect, useMemo, useState} from "react";
import {cn} from "@/utils/cn.ts";

type PairDef = {
  leftId: string;
  rightId: string;
  left: string;
  right: string;
};

type Card = { id: string; text: string };

type Locked = {
  leftId: string;
  rightId: string;
  pairNo: number;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const PAIR_RING = "border-blue-400 bg-blue-50/90 text-[#0a192f]";

type Props = {
  /** Legacy mock: cặp đúng để chấm local */
  pairs?: PairDef[];
  /** API: hai cột đã xáo từ server — không shuffle thêm cột phải */
  leftColumn?: Card[];
  rightColumn?: Card[];
  /** Mặc định true (mock); API đặt false */
  shuffleRight?: boolean;
  /** Mock: chấm đúng/sai local */
  onSubmitScore?: (correctCount: number, total: number) => void;
  /** API: danh sách cặp user ghép (để gửi submit-section) */
  onSubmitPairs?: (pairs: { leftCardId: string; rightCardId: string }[]) => void;
  onLockedPairsChange?: (lockedCount: number) => void;
};

/**
 * Ghép khóa cặp: chọn trái + chọn phải → khóa ngay, không gỡ.
 * Đủ 5 cặp → Nộp bài.
 */
export default function PlacementMatchingLock({
  pairs,
  leftColumn,
  rightColumn,
  shuffleRight = true,
  onSubmitScore,
  onSubmitPairs,
  onLockedPairsChange,
}: Props) {
  const derived = useMemo(() => {
    if (leftColumn && rightColumn) {
      const left: Card[] = leftColumn;
      const right: Card[] =
        shuffleRight ? shuffle([...rightColumn]) : [...rightColumn];
      const correctMap = new Map<string, string>();
      return {left, right, correctMap, total: left.length};
    }
    if (pairs?.length) {
      const left = pairs.map((p) => ({id: p.leftId, text: p.left}));
      const right = shuffle(
        pairs.map((p) => ({
          id: p.rightId,
          text: p.right,
        }))
      );
      const correctMap = new Map<string, string>();
      pairs.forEach((p) => correctMap.set(p.leftId, p.rightId));
      return {left, right, correctMap, total: pairs.length};
    }
    return {left: [] as Card[], right: [] as Card[], correctMap: new Map(), total: 0};
  }, [leftColumn, rightColumn, pairs, shuffleRight]);

  const {left, right, correctMap, total} = derived;

  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [locked, setLocked] = useState<Locked[]>([]);

  useEffect(() => {
    onLockedPairsChange?.(locked.length);
  }, [locked, onLockedPairsChange]);

  useEffect(() => {
    setSelectedLeftId(null);
    setLocked([]);
  }, [leftColumn, rightColumn, pairs]);

  const lockedLeft = useMemo(() => new Set(locked.map((l) => l.leftId)), [locked]);
  const lockedRight = useMemo(() => new Set(locked.map((l) => l.rightId)), [locked]);

  function pairNoForLeft(id: string) {
    return locked.find((l) => l.leftId === id)?.pairNo;
  }
  function pairNoForRight(id: string) {
    return locked.find((l) => l.rightId === id)?.pairNo;
  }

  function handlePickLeft(id: string) {
    if (lockedLeft.has(id)) return;
    setSelectedLeftId((prev) => (prev === id ? null : id));
  }

  function handlePickRight(rightId: string) {
    if (lockedRight.has(rightId)) return;
    if (!selectedLeftId) {
      return;
    }
    const nextNo = locked.length + 1;
    setLocked((prev) => [...prev, {leftId: selectedLeftId, rightId, pairNo: nextNo}]);
    setSelectedLeftId(null);
  }

  const allPaired = locked.length === total && total > 0;

  function handleSubmitSection() {
    if (!allPaired) return;
    const payload = locked.map((l) => ({
      leftCardId: l.leftId,
      rightCardId: l.rightId,
    }));
    if (onSubmitPairs) {
      onSubmitPairs(payload);
      return;
    }
    let correct = 0;
    locked.forEach((l) => {
      if (correctMap.get(l.leftId) === l.rightId) correct++;
    });
    onSubmitScore?.(correct, total);
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
        <div className="space-y-3">
          {left.map((p, idx) => {
            const pn = pairNoForLeft(p.id);
            const isLocked = pn != null;
            const isSel = selectedLeftId === p.id && !isLocked;
            return (
              <button
                key={p.id}
                type="button"
                disabled={isLocked}
                onClick={() => handlePickLeft(p.id)}
                className={cn(
                  "relative flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left shadow-sm transition",
                  isLocked && "pointer-events-none opacity-60",
                  !isLocked && !isSel && "border-gray-200 bg-white hover:border-gray-300",
                  isSel && "border-primary-500 bg-primary-50 ring-2 ring-primary-200",
                  isLocked && PAIR_RING
                )}
              >
                {pn != null && (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-300 bg-white text-xs font-extrabold text-blue-700">
                    {pn}
                  </span>
                )}
                {pn == null && (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-xs font-bold text-gray-400">
                    {idx + 1}
                  </span>
                )}
                <span className="text-sm font-semibold text-gray-900 md:text-base">{p.text}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          {right.map((r) => {
            const pn = pairNoForRight(r.id);
            const isLocked = pn != null;
            const isSel = false;
            return (
              <button
                key={r.id}
                type="button"
                disabled={isLocked}
                onClick={() => handlePickRight(r.id)}
                className={cn(
                  "relative flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left shadow-sm transition",
                  isLocked && "pointer-events-none opacity-60",
                  !isLocked && !isSel && "border-gray-200 bg-white hover:border-gray-300",
                  isLocked && PAIR_RING
                )}
              >
                <span className="flex-1 text-sm font-semibold text-gray-900 md:text-base">{r.text}</span>
                {pn != null && (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-300 bg-white text-xs font-extrabold text-blue-700">
                    {pn}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-10 flex flex-col items-center gap-2">
        <button
          type="button"
          disabled={!allPaired}
          onClick={handleSubmitSection}
          className={cn(
            "rounded-full px-10 py-3 text-sm font-bold shadow-md transition md:text-base",
            allPaired
              ? "bg-[#F9CF15] text-gray-900 hover:brightness-95"
              : "cursor-not-allowed bg-gray-300 text-gray-500"
          )}
        >
          Nộp bài
        </button>
        <p className="text-center text-xs text-gray-500">
          {locked.length}/{total} cặp đã ghép
          {allPaired ? " — sẵn sàng chấm điểm." : ""}
        </p>
      </div>
    </div>
  );
}
