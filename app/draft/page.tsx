import { getUsers, SleeperApiError } from "@/lib/sleeper/client";
import {
  buildDraftCountdown,
  draftSummaryLabel,
  draftTypeLabel,
  formatDraftDate,
  getCurrentDraft,
  getDraftResults,
} from "@/lib/sleeper/draft";
import { getLeagueHistory } from "@/lib/sleeper/history";
import { draftOrderFromStandings } from "@/lib/draft-order";
import { siteConfig } from "@/lib/site-config";
import DataUnavailable from "@/components/DataUnavailable";
import DraftCountdown from "@/components/DraftCountdown";
import DraftOrderTable from "@/components/DraftOrderTable";

export const revalidate = 300;
export const metadata = { title: "Draft Central" };

export default async function DraftPage() {
  let draft = null;
  let picks: Awaited<ReturnType<typeof getDraftResults>> = [];
  let teamNameByUserId = new Map<string, string>();
  let loadError = false;

  try {
    const users = await getUsers(siteConfig.sleeperLeagueId);
    teamNameByUserId = new Map(
      users.map((u) => [u.user_id, u.metadata?.team_name?.trim() || u.display_name])
    );
    draft = await getCurrentDraft(siteConfig.sleeperLeagueId);
    if (draft && (draft.status === "complete" || draft.status === "in_progress")) {
      picks = await getDraftResults(draft.draft_id);
    }
  } catch (err) {
    if (!(err instanceof SleeperApiError)) throw err;
    loadError = true;
  }

  const countdown = buildDraftCountdown(draft, siteConfig.nextDraftFallbackDate);

  const history = await getLeagueHistory(siteConfig.sleeperLeagueId).catch(() => null);
  const currentStandings = history?.seasons[0]?.standings ?? [];
  const draftOrder = draftOrderFromStandings(currentStandings);

  const rounds = new Map<number, typeof picks>();
  for (const pick of picks) {
    const list = rounds.get(pick.round) ?? [];
    list.push(pick);
    rounds.set(pick.round, list);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display uppercase tracking-wide text-league-primary text-2xl mb-2">
        Draft Central
      </h1>
      <p className="text-league-ink/60 mb-8">
        Draft settings, live draft order, and full results once the draft happens.
      </p>

      <div className="mb-10">
        <DraftCountdown countdown={countdown} />
      </div>

      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-display uppercase tracking-wide text-league-primary text-lg">
          Draft Order
        </h2>
        <span className="text-xs text-league-ink/40">If the season ended today</span>
      </div>
      {draftOrder.length > 0 ? (
        <div className="mb-12">
          <DraftOrderTable order={draftOrder} />
        </div>
      ) : (
        <div className="mb-12">
          <DataUnavailable what="draft order" />
        </div>
      )}

      {loadError ? (
        <DataUnavailable what="draft info" />
      ) : (
        <>
          <div className="bg-white rounded-lg border border-league-ink/10 shadow-sm p-6 mb-10 max-w-md">
            <h2 className="font-display uppercase tracking-wide text-league-primary text-sm mb-3">
              This Season&apos;s Draft
            </h2>
            <p className="text-lg font-medium">{draft ? draftSummaryLabel(draft) : "Not yet scheduled"}</p>
            {draft ? (
              <p className="text-sm text-league-ink/60 mt-1">
                {draft.settings.rounds ?? "?"} rounds · {draftTypeLabel(draft.type)} ·{" "}
                {formatDraftDate(draft.start_time)}
              </p>
            ) : null}
          </div>

          <h2 className="font-display uppercase tracking-wide text-league-primary text-lg mb-4">
            Draft Results
          </h2>
          {picks.length > 0 ? (
            <div className="space-y-8">
              {Array.from(rounds.entries())
                .sort((a, b) => a[0] - b[0])
                .map(([round, roundPicks]) => (
                  <div key={round}>
                    <h3 className="font-display uppercase tracking-wide text-league-primary text-sm mb-3">
                      Round {round}
                    </h3>
                    <div className="overflow-x-auto rounded-lg border border-league-ink/10 bg-white shadow-sm">
                      <table className="w-full text-sm">
                        <tbody>
                          {roundPicks
                            .sort((a, b) => a.pick_no - b.pick_no)
                            .map((pick) => (
                              <tr key={pick.pick_no} className="border-t border-league-ink/10 first:border-0">
                                <td className="px-4 py-2 text-league-ink/50 w-12">{pick.pick_no}</td>
                                <td className="px-4 py-2 font-medium">
                                  {pick.metadata?.first_name} {pick.metadata?.last_name}
                                  {pick.metadata?.position ? ` (${pick.metadata.position})` : ""}
                                </td>
                                <td className="px-4 py-2 text-league-ink/60 text-right">
                                  {teamNameByUserId.get(pick.picked_by) ?? "—"}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-league-ink/50 text-sm">
              Draft results will show up here once the draft has started.
            </p>
          )}
        </>
      )}
    </div>
  );
}
