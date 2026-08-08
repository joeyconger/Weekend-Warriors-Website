import type { SeasonStanding } from "@/lib/sleeper/history";

export default function DraftOrderTable({ order }: { order: SeasonStanding[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-league-ink/10 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-league-primary text-white text-left uppercase text-xs tracking-wide">
            <th className="px-4 py-3">Pick</th>
            <th className="px-4 py-3">Team</th>
            <th className="px-4 py-3 text-right">Record</th>
            <th className="px-4 py-3 text-right">Points</th>
          </tr>
        </thead>
        <tbody>
          {order.map((s, i) => (
            <tr key={s.rosterId} className="border-t border-league-ink/10">
              <td className="px-4 py-3 font-display text-league-accent-dark">{i + 1}</td>
              <td className="px-4 py-3">
                <span className="font-medium">{s.teamName}</span>
                <span className="text-league-ink/50"> · {s.displayName}</span>
              </td>
              <td className="px-4 py-3 text-right">
                {s.wins}-{s.losses}
                {s.ties > 0 ? `-${s.ties}` : ""}
              </td>
              <td className="px-4 py-3 text-right text-league-ink/60">{s.pointsFor.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
