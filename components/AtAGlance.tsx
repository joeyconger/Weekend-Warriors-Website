import type { SleeperLeague } from "@/lib/sleeper/types";
import {
  playoffStructureLabel,
  rosterPositionsSummary,
  scoringFormatLabel,
  tradeDeadlineLabel,
} from "@/lib/sleeper/league-info";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-league-ink/10 last:border-0">
      <span className="text-league-ink/60 text-sm">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

export default function AtAGlance({
  league,
  draftLabel,
}: {
  league: SleeperLeague;
  draftLabel: string;
}) {
  const roster = rosterPositionsSummary(league)
    .filter((r) => r.position !== "BN" && r.position !== "IR" && r.position !== "TAXI")
    .map((r) => `${r.count} ${r.position}`)
    .join(" · ");

  return (
    <div className="bg-white rounded-lg border border-league-ink/10 shadow-sm p-6">
      <h3 className="font-display uppercase tracking-wide text-league-primary text-sm mb-3">
        League at a Glance
      </h3>
      <Row label="Scoring" value={scoringFormatLabel(league)} />
      <Row label="Roster" value={roster || "—"} />
      <Row label="Teams" value={String(league.total_rosters)} />
      <Row label="Draft" value={draftLabel} />
      <Row label="Playoffs" value={playoffStructureLabel(league)} />
      <Row label="Trade deadline" value={tradeDeadlineLabel(league)} />
    </div>
  );
}
