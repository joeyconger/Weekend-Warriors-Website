import Image from "next/image";
import { avatarUrl } from "@/lib/sleeper/client";
import type { AllTimeManagerStat, ManagerIdentity } from "@/lib/sleeper/history";

export default function ManagerCard({
  identity,
  stats,
}: {
  identity: ManagerIdentity;
  stats: AllTimeManagerStat | undefined;
}) {
  const avatar = avatarUrl(identity.avatar);
  const titles = stats?.titles ?? 0;

  return (
    <div className="bg-white rounded-lg border border-league-ink/10 shadow-sm p-5 flex gap-4 items-start">
      <div className="relative h-14 w-14 flex-shrink-0 rounded-full overflow-hidden bg-league-primary/10 border border-league-ink/10">
        {avatar ? (
          <Image src={avatar} alt={identity.displayName} fill sizes="56px" className="object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-league-primary font-display text-lg">
            {identity.displayName.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="font-display text-league-primary font-semibold truncate">
          {identity.teamName}
        </p>
        <p className="text-sm text-league-ink/60 truncate">{identity.displayName}</p>
        {titles > 0 ? (
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-league-accent/15 text-league-accent-dark text-xs font-semibold px-2 py-0.5">
              {titles} title{titles > 1 ? "s" : ""}
            </span>
            <span className="text-xs text-league-ink/50">
              {stats!.titleYears.join(", ")}
            </span>
          </div>
        ) : (
          <p className="mt-2 text-xs text-league-ink/40">No titles yet</p>
        )}
      </div>
    </div>
  );
}
