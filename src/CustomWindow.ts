import { TimelineEvent } from "./types.ts";

export interface CustomWindow {
  timelineEvents: Record<string, TimelineEvent | undefined>;
}
