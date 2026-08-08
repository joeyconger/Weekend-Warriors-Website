import type { Storyline, StorylineType } from "@/lib/storylines/types";

const TYPE_LABEL: Record<StorylineType, string> = {
  trade: "Trade Recap",
  matchup: "Matchup Recap",
  streak: "Hot Streak",
  waiver: "Waiver Wire",
  rivalry: "Rivalry Update",
  analysis: "Power Rankings",
};

const TYPE_COLOR: Record<StorylineType, string> = {
  trade: "bg-blue-100 text-blue-800",
  matchup: "bg-emerald-100 text-emerald-800",
  streak: "bg-orange-100 text-orange-800",
  waiver: "bg-purple-100 text-purple-800",
  rivalry: "bg-rose-100 text-rose-800",
  analysis: "bg-indigo-100 text-indigo-800",
};

export default function StorylineCard({ storyline }: { storyline: Storyline }) {
  return (
    <div className="bg-white rounded-lg border border-league-ink/10 shadow-sm p-5">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span
          className={`inline-flex items-center rounded-full text-xs font-semibold px-2 py-0.5 ${TYPE_COLOR[storyline.type]}`}
        >
          {TYPE_LABEL[storyline.type]}
        </span>
        <span className="text-xs text-league-ink/40">
          {storyline.season}
          {storyline.week ? ` · Wk ${storyline.week}` : ""}
        </span>
      </div>
      <h3 className="font-display text-league-primary font-semibold mb-1">{storyline.title}</h3>
      <p className="text-sm text-league-ink/80 leading-relaxed">{storyline.body}</p>
    </div>
  );
}
