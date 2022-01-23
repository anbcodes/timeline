import { DateTime } from "https://cdn.skypack.dev/luxon?dts";
import { calcYearInc } from "./rendering.ts";

export const stopPropagation = (e: Event) => e.stopPropagation();
// export const formatYear = (year: number) =>
//   year >= 0 ? `${year} AD` : `${Math.abs(year)} BC`;

export const yearSeconds = (year: number) => {
  return DateTime.fromObject({
    year,
  }).toSeconds();
};

export const formatDate = (date: number) => {
  const datetime = DateTime.fromSeconds(date);
  const suffix = datetime.year > 0 ? "AD" : "BC";
  let formattedDate = datetime.toLocaleString({
    year: "numeric",
  }) + " " + suffix;
  const increment = calcYearInc();
  if (increment === "month") {
    formattedDate = datetime.toLocaleString({
      year: "numeric",
      month: "narrow",
      day: "numeric",
    });
  }

  if (increment === "day") {
    formattedDate = datetime.toLocaleString({
      month: "narrow",
      day: "numeric",
      hour: "numeric",
      hour12: true,
      minute: "numeric",
      second: "numeric",
    });
  }

  return formattedDate;
};
