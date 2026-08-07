/**
 * Manager pairs tagged as rivals. When two tagged managers play each other,
 * the Storylines generator produces a "rivalry update" post after that
 * matchup. Match names exactly as they appear as Sleeper display names.
 */
export interface RivalryTag {
  managerA: string;
  managerB: string;
}

export const rivalryTags: RivalryTag[] = [
  // { managerA: "Some Manager", managerB: "Their Nemesis" },
];
