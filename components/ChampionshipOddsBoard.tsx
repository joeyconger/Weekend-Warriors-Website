import type { ChampionshipOdds } from "@/lib/odds";

export default function ChampionshipOddsBoard({ odds }: { odds: ChampionshipOdds[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-league-ink/10 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-league-primary text-white text-left uppercase text-xs tracking-wide">
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Team</th>
            <th className="px-4 py-3 text-right">Odds</th>
          </tr>
        </thead>
        <tbody>
          {odds.map((entry, i) => (
            <tr key={entry.identity.userId} className="border-t border-league-ink/10">
              <td className="px-4 py-3 text-league-ink/50">{i + 1}</td>
              <td className="px-4 py-3">
                <span className="font-medium">{entry.identity.teamName}</span>
                <span className="text-league-ink/50"> · {entry.identity.displayName}</span>
              </td>
              <td className="px-4 py-3 text-right font-display text-lg text-league-accent-dark">
                {entry.americanOdds}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
