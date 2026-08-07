export default function DataUnavailable({
  what = "live league data",
}: {
  what?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-league-primary/30 bg-white px-6 py-8 text-center text-league-ink/70">
      <p className="font-medium">Couldn&apos;t reach Sleeper for {what} right now.</p>
      <p className="text-sm mt-1">
        This refreshes automatically — check back in a few minutes.
      </p>
    </div>
  );
}
