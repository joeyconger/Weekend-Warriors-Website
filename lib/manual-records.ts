/**
 * Records Sleeper's API can't compute — pre-Sleeper history, or anything
 * subjective. Add entries here; each renders as a card on the Records page
 * next to the auto-computed ones.
 */
export interface ManualRecord {
  title: string;
  value: string;
  holder: string;
  note?: string;
}

export const manualRecords: ManualRecord[] = [
  // Example — replace with real history, or delete if there isn't any
  // pre-Sleeper history to carry over:
  // {
  //   title: "Most Championships (pre-Sleeper era)",
  //   value: "2 titles",
  //   holder: "Some Manager",
  //   note: "2017–2018, before the league moved to Sleeper",
  // },
];
