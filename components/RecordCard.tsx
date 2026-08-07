export default function RecordCard({
  title,
  value,
  holder,
  note,
  auto = true,
}: {
  title: string;
  value: string;
  holder: string;
  note?: string;
  auto?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg border border-league-ink/10 shadow-sm p-5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display uppercase tracking-wide text-league-primary text-sm">
          {title}
        </h3>
        {auto ? (
          <span className="text-[10px] uppercase tracking-wide text-league-ink/40 flex-shrink-0">
            via Sleeper
          </span>
        ) : null}
      </div>
      <p className="mt-2 font-display text-3xl font-semibold text-league-accent-dark">
        {value}
      </p>
      <p className="mt-1 text-sm text-league-ink/70">{holder}</p>
      {note ? <p className="mt-1 text-xs text-league-ink/50">{note}</p> : null}
    </div>
  );
}
