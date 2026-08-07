import { getMatchups, getNflState, getRosters, getUsers } from "./client";
import type { ManagerIdentity } from "./history";

export interface WeekMatchup {
  matchupId: number;
  teams: Array<{ identity: ManagerIdentity; points: number }>;
}

export async function getCurrentWeek(): Promise<number> {
  const state = await getNflState();
  return state.week || 1;
}

export async function getWeekMatchups(
  leagueId: string,
  week: number
): Promise<WeekMatchup[]> {
  const [matchups, rosters, users] = await Promise.all([
    getMatchups(leagueId, week),
    getRosters(leagueId),
    getUsers(leagueId),
  ]);

  const usersById = new Map(users.map((u) => [u.user_id, u]));
  const rosterById = new Map(rosters.map((r) => [r.roster_id, r]));

  const grouped = new Map<number, WeekMatchup["teams"]>();
  for (const m of matchups) {
    if (m.matchup_id == null) continue;
    const roster = rosterById.get(m.roster_id);
    const user = roster?.owner_id ? usersById.get(roster.owner_id) : undefined;
    const identity: ManagerIdentity = user
      ? {
          userId: user.user_id,
          displayName: user.display_name,
          teamName: user.metadata?.team_name?.trim() || user.display_name,
          avatar: user.avatar,
        }
      : {
          userId: `unknown-${m.roster_id}`,
          displayName: "Unknown Manager",
          teamName: `Team ${m.roster_id}`,
          avatar: null,
        };

    const list = grouped.get(m.matchup_id) ?? [];
    list.push({ identity, points: m.points ?? 0 });
    grouped.set(m.matchup_id, list);
  }

  return Array.from(grouped.entries()).map(([matchupId, teams]) => ({
    matchupId,
    teams,
  }));
}
