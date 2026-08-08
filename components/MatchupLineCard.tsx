import type { MatchupLine } from "@/lib/odds";

export default function MatchupLineCard({ line }: { line: MatchupLine }) {
  const aIsFavorite = line.favorite.userId === line.teamA.userId;

  return (
    <div className="bg-white rounded-lg border border-league-ink/10 shadow-sm p-4">
      <div className="flex items-center justify-between gap-4">
        <TeamLine
          name={line.teamA.teamName}
          moneyline={line.moneylineA}
          spread={aIsFavorite ? `-${line.spread}` : `+${line.spread}`}
          favorite={aIsFavorite}
        />
        <span className="text-league-ink/30 text-xs uppercase flex-shrink-0">vs</span>
        <TeamLine
          name={line.teamB.teamName}
          moneyline={line.moneylineB}
          spread={!aIsFavorite ? `-${line.spread}` : `+${line.spread}`}
          favorite={!aIsFavorite}
          align="right"
        />
      </div>
      <p className="text-center text-xs text-league-ink/40 mt-3 pt-3 border-t border-league-ink/10">
        Total O/U {line.total}
      </p>
    </div>
  );
}

function TeamLine({
  name,
  moneyline,
  spread,
  favorite,
  align = "left",
}: {
  name: string;
  moneyline: string;
  spread: string;
  favorite: boolean;
  align?: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : "text-left"}>
      <p className={`text-sm font-medium ${favorite ? "text-league-primary" : "text-league-ink/70"}`}>
        {name}
      </p>
      <p className="text-xs text-league-ink/50">
        {spread} · {moneyline}
      </p>
    </div>
  );
}
