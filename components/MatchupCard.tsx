import type { WeekMatchup } from "@/lib/sleeper/current-week";

export default function MatchupCard({ matchup }: { matchup: WeekMatchup }) {
  const [a, b] = matchup.teams;
  if (!a) return null;

  return (
    <div className="bg-white rounded-lg border border-league-ink/10 shadow-sm p-4 flex items-center justify-between gap-4">
      <TeamLine name={a.identity.teamName} points={a.points} lead={b ? a.points >= b.points : false} />
      <span className="text-league-ink/30 text-xs uppercase">vs</span>
      {b ? (
        <TeamLine name={b.identity.teamName} points={b.points} lead={a.points < b.points} align="right" />
      ) : (
        <span className="text-league-ink/40 text-sm">Bye</span>
      )}
    </div>
  );
}

function TeamLine({
  name,
  points,
  lead,
  align = "left",
}: {
  name: string;
  points: number;
  lead: boolean;
  align?: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : "text-left"}>
      <p className={`text-sm font-medium ${lead ? "text-league-primary" : "text-league-ink/70"}`}>
        {name}
      </p>
      <p className={`font-display text-xl ${lead ? "text-league-accent-dark" : "text-league-ink/50"}`}>
        {points.toFixed(1)}
      </p>
    </div>
  );
}
