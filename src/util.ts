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

export const formatSeconds = (date: number, increment = calcYearInc()) => {
  const datetime = DateTime.fromSeconds(date);
  const suffix = datetime.year > 0 ? "AD" : "BC";
  let formattedDate = datetime.toLocaleString({
    year: "numeric",
  }) + " " + suffix;
  if (increment.months >= 1) {
    formattedDate = datetime.toLocaleString({
      year: "numeric",
      month: "short",
    });
  }

  if (increment.days >= 1 || increment.weeks >= 1) {
    formattedDate = datetime.toLocaleString({
      month: "short",
      day: "numeric",
    });
  }

  if (increment.hours >= 1) {
    formattedDate = datetime.toLocaleString({
      hour12: true,
      hour: 'numeric',
    });
  }

  if (increment.minutes >= 1) {
    formattedDate = datetime.toLocaleString({
      hour12: true,
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  if (increment.seconds >= 1) {
    formattedDate = datetime.toLocaleString({
      hour12: true,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  return formattedDate;
};