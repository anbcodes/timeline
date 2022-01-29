import { DateTime } from "https://cdn.skypack.dev/luxon?dts";
import { XmlEntities } from "https://deno.land/x/html_entities/mod.js";
import { calcYearInc } from "./rendering.ts";

export const partToPrefix = (part: "start" | "end" | "both") =>
  part === "start" ? "Begin: " : (part === "end" ? "End: " : "");

export const stopPropagation = (e: Event) => e.stopPropagation();

export const shtml = (strings: TemplateStringsArray, ...exprs: string[]) => {
  let str = "";
  exprs.forEach((exp, i) => {
    str += strings[i];
    str += XmlEntities.encode(exp);
  });
  if (strings[exprs.length]) {
    str += strings[exprs.length];
  }
  return str;
};

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
      // year: "numeric",
      month: "long",
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
      hour: "numeric",
    });
  }

  if (increment.minutes >= 1) {
    formattedDate = datetime.toLocaleString({
      hour12: true,
      hour: "numeric",
      minute: "2-digit",
    });
  }

  if (increment.seconds >= 1) {
    formattedDate = datetime.toLocaleString({
      hour12: true,
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  return formattedDate;
};
