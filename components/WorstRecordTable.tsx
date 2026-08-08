import type { WorstRecordEntry } from "@/lib/wall-of-shame";

export default function WorstRecordTable({ entries }: { entries: WorstRecordEntry[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-league-ink/10 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-league-primary text-white text-left uppercase text-xs tracking-wide">
            <th className="px-4 py-3">Season</th>
            <th className="px-4 py-3">Team</th>
            <th className="px-4 py-3 text-right">Record</th>
            <th className="px-4 py-3 text-right">Points</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(({ season, team }) => (
            <tr key={season} className="border-t border-league-ink/10">
              <td className="px-4 py-3 font-display text-league-accent-dark">{season}</td>
              <td className="px-4 py-3">
                <span className="font-medium">{team.teamName}</span>
                <span className="text-league-ink/50"> · {team.displayName}</span>
              </td>
              <td className="px-4 py-3 text-right">
                {team.wins}-{team.losses}
                {team.ties > 0 ? `-${team.ties}` : ""}
              </td>
              <td className="px-4 py-3 text-right text-league-ink/60">{team.pointsFor.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
