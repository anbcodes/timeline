import { yearSeconds } from "./util.ts";
import { DateTime } from "https://cdn.skypack.dev/luxon?dts";

export const ZOOM_SPEED = 1.05;
export const YEAR_RANGE = [
  yearSeconds(-10000),
  yearSeconds(2500),
];

// export const YEAR_RANGE = [
//   yearSeconds(1990),
//   yearSeconds(2000),
// ];

// export const YEAR_PADDING = yearSeconds(1);
export const YEAR_PADDING = 60 * 60 * 24 * 365 * 1000;
// export const YEAR_PADDING = 60 * 60 * 24 * 365 * 1;
