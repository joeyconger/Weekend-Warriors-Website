import type { DraftCountdown as DraftCountdownData } from "@/lib/sleeper/draft";

export default function DraftCountdown({ countdown }: { countdown: DraftCountdownData }) {
  const dateLabel = countdown.targetDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="bg-league-primary text-white rounded-lg p-6 flex items-center gap-6">
      <div>
        <p className="font-display text-4xl font-bold text-league-accent leading-none">
          {countdown.daysRemaining}
        </p>
        <p className="text-xs uppercase tracking-wide text-white/60 mt-1">Days</p>
      </div>
      <div>
        <p className="font-display uppercase tracking-wide text-sm">Next Draft</p>
        <p className="text-white/70 text-sm">{dateLabel}</p>
        {countdown.source === "fallback" ? (
          <p className="text-white/40 text-xs mt-1">
            Tentative — Sleeper hasn&apos;t scheduled it yet
          </p>
        ) : null}
      </div>
    </div>
  );
}
