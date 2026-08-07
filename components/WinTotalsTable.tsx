import type { WinTotal } from "@/lib/odds";

export default function WinTotalsTable({ totals }: { totals: WinTotal[] }) {
  const sorted = [...totals].sort((a, b) => b.line - a.line);

  return (
    <div className="overflow-x-auto rounded-lg border border-league-ink/10 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-league-primary text-white text-left uppercase text-xs tracking-wide">
            <th className="px-4 py-3">Team</th>
            <th className="px-4 py-3 text-right">Win Total</th>
            <th className="px-4 py-3 text-right">Current</th>
            <th className="px-4 py-3 text-right">Games Left</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((t) => (
            <tr key={t.identity.userId} className="border-t border-league-ink/10">
              <td className="px-4 py-3">
                <span className="font-medium">{t.identity.teamName}</span>
                <span className="text-league-ink/50"> · {t.identity.displayName}</span>
              </td>
              <td className="px-4 py-3 text-right font-display text-lg text-league-accent-dark">
                O/U {t.line}
              </td>
              <td className="px-4 py-3 text-right text-league-ink/60">{t.currentWins}</td>
              <td className="px-4 py-3 text-right text-league-ink/60">{t.gamesRemaining}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
