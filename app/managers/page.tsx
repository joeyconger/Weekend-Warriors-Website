import { getRosters, getUsers, SleeperApiError } from "@/lib/sleeper/client";
import { getLeagueHistory } from "@/lib/sleeper/history";
import { siteConfig } from "@/lib/site-config";
import ManagerCard from "@/components/ManagerCard";
import DataUnavailable from "@/components/DataUnavailable";

export const revalidate = 300;
export const metadata = { title: "Managers" };

export default async function ManagersPage() {
  let identities: { userId: string; displayName: string; teamName: string; avatar: string | null }[] = [];
  let loadError = false;

  try {
    const [rosters, users] = await Promise.all([
      getRosters(siteConfig.sleeperLeagueId),
      getUsers(siteConfig.sleeperLeagueId),
    ]);
    const usersById = new Map(users.map((u) => [u.user_id, u]));
    identities = rosters
      .filter((r) => r.owner_id)
      .map((r) => {
        const user = usersById.get(r.owner_id!);
        return {
          userId: r.owner_id!,
          displayName: user?.display_name ?? "Unknown Manager",
          teamName: user?.metadata?.team_name?.trim() || user?.display_name || `Team ${r.roster_id}`,
          avatar: user?.avatar ?? null,
        };
      })
      .sort((a, b) => a.teamName.localeCompare(b.teamName));
  } catch (err) {
    if (!(err instanceof SleeperApiError)) throw err;
    loadError = true;
  }

  const history = await getLeagueHistory(siteConfig.sleeperLeagueId).catch(() => null);
  const statsByUser = new Map((history?.managers ?? []).map((m) => [m.userId, m]));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display uppercase tracking-wide text-league-primary text-2xl mb-2">
        Managers
      </h1>
      <p className="text-league-ink/60 mb-8">
        The {identities.length || ""} people who show up every Sunday.
      </p>

      {loadError ? (
        <DataUnavailable what="the current manager list" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {identities.map((identity) => (
            <ManagerCard
              key={identity.userId}
              identity={identity}
              stats={statsByUser.get(identity.userId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
