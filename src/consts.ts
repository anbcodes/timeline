import { yearSeconds } from "./util.ts";
import { DateTime } from "https://cdn.skypack.dev/luxon?dts";

export const ZOOM_SPEED = 1.05;
export const YEAR_RANGE = [
  yearSeconds(-10000),
  yearSeconds(2500),
];
