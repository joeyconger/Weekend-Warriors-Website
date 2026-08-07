import type { SeasonStanding } from "@/lib/sleeper/history";

export default function StandingsTable({ standings }: { standings: SeasonStanding[] }) {
  const sorted = [...standings].sort(
    (a, b) => b.wins - a.wins || b.pointsFor - a.pointsFor
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-league-ink/10 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-league-primary text-white text-left uppercase text-xs tracking-wide">
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Team</th>
            <th className="px-4 py-3 text-right">W</th>
            <th className="px-4 py-3 text-right">L</th>
            <th className="px-4 py-3 text-right">T</th>
            <th className="px-4 py-3 text-right">PF</th>
            <th className="px-4 py-3 text-right">PA</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((s, i) => (
            <tr key={s.rosterId} className="border-t border-league-ink/10">
              <td className="px-4 py-3 text-league-ink/50">{i + 1}</td>
              <td className="px-4 py-3">
                <span className="font-medium">{s.teamName}</span>
                <span className="text-league-ink/50"> · {s.displayName}</span>
              </td>
              <td className="px-4 py-3 text-right">{s.wins}</td>
              <td className="px-4 py-3 text-right">{s.losses}</td>
              <td className="px-4 py-3 text-right">{s.ties}</td>
              <td className="px-4 py-3 text-right">{s.pointsFor.toFixed(1)}</td>
              <td className="px-4 py-3 text-right">{s.pointsAgainst.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
