import { YEAR_PADDING, YEAR_RANGE } from "./consts.ts";
import { content } from "./elements.ts";
import { formatSeconds, shtml, stopPropagation } from "./util.ts";
import { TimelineEvent } from "./types.ts";
import { displayEvent } from "./eventViewController.ts";
import { makeNoise2D } from "https://deno.land/x/open_simplex_noise/mod.ts";
import { DateTime, Duration } from "https://cdn.skypack.dev/luxon?dts";

declare global {
  interface Window {
    timelineEvents: Record<string, TimelineEvent | undefined>;
  }
}

export let scale = +(localStorage.getItem("scale") || 1);
export let offset = +(localStorage.getItem("offset") || 0);

const totalSeconds = () => YEAR_RANGE[1] - YEAR_RANGE[0];

const secondsToPixels = (seconds: number): number => {
  const secondsPercent = seconds / totalSeconds();
  const totalPixels = innerWidth * scale;
  const pixels = secondsPercent * totalPixels;
  return pixels;
};

const pixelsToSeconds = (pixels: number) => {
  const totalPixels = secondsToPixels(totalSeconds());
  const pixelsPercent = pixels / totalPixels;
  const seconds = pixelsPercent * totalSeconds();
  return seconds;
};

const secondsToOffsetInPixels = (seconds: number) => {
  return secondsToPixels(seconds - YEAR_RANGE[0]) - offset;
};

const pixelToSecondsOffset = (pixels: number) => {
  return pixelsToSeconds(pixels + offset) + YEAR_RANGE[0];
};

const noise = makeNoise2D(272727);

export const calcYearInc = () => {
  return getYearIncrements().slice(-1)[0].duration;
};

export const getYearIncrements = () => {
  // let yearInc = 2000;
  // const fiveXs = Math.floor(scale / 3);
  // yearInc = yearInc / 2 / fiveXs;

  // yearInc = 2000 / 2 / floor(scale / 3)
  // = 1000 / (scale / 3)
  // = 3000 / scale
  // pixels per tick ~~ constant
  // vr = visible range in seconds
  // number of ticks = (visibleRangeSeconds / secondsInYear) / yearInc
  // number of ticks = screenWidthPixels / pixelsPerTick
  // screenWidthPixels / pixelsPerTick = (visibleRangeSeconds / secondsInYear) / yearInc
  // screenWidthPixels * yearInc = pixelsPerTick * (visibleRangeSeconds / secondsInYear)
  // yearInc = pixelsPerTick * (visibleRangeSeconds / secondsInYear) / screenWidthPixels
  const pixelsPerTick = 200;
  const visibleRangeSeconds = pixelToSecondsOffset(innerWidth) -
    pixelToSecondsOffset(0);
  // console.log("Visible range seconds", visibleRangeSeconds);
  const secondsInYear = 60 * 60 * 24 * 365;
  const screenWidthPixels = innerWidth;
  const yearInc = pixelsPerTick * (visibleRangeSeconds / secondsInYear) /
    screenWidthPixels;
  // console.log("yearInc", yearInc);
  // console.log("Screen width pixels", screenWidthPixels);
  // console.log(
  //   "# of ticks 1",
  //   screenWidthPixels / pixelsPerTick,
  //   (visibleRangeSeconds / secondsInYear) / yearInc,
  // );

  const increments: [number, Duration, boolean][] = [
    [Infinity, Duration.fromObject({ years: 5000 }), false],
    [2000, Duration.fromObject({ years: 2000 }), false],
    [1000, Duration.fromObject({ years: 1000 }), false],
    [500, Duration.fromObject({ years: 500 }), false],
    [250, Duration.fromObject({ years: 250 }), false],
    [100, Duration.fromObject({ years: 100 }), false],
    [50, Duration.fromObject({ years: 50 }), false],
    [25, Duration.fromObject({ years: 25 }), false],
    [10, Duration.fromObject({ years: 10 }), false],
    [5, Duration.fromObject({ years: 5 }), false],
    [2, Duration.fromObject({ years: 2 }), false],
    [1, Duration.fromObject({ years: 1 }), false],
    [1 / 4, Duration.fromObject({ months: 3 }), true],
    [1 / 12, Duration.fromObject({ months: 1 }), false],
    [1 / 52, Duration.fromObject({ weeks: 1 }), false],
    [1 / 365, Duration.fromObject({ days: 1 }), false],
    [1 / 365 / 4, Duration.fromObject({ hours: 6 }), true],
    [1 / 365 / 8, Duration.fromObject({ hours: 3 }), false],
    [1 / 365 / 24, Duration.fromObject({ hours: 1 }), false],
    [1 / 365 / 24 / 2, Duration.fromObject({ minutes: 30 }), false],
    [1 / 365 / 24 / 4, Duration.fromObject({ minutes: 15 }), false],
    [1 / 365 / 24 / 6, Duration.fromObject({ minutes: 10 }), false],
    [1 / 365 / 24 / 12, Duration.fromObject({ minutes: 5 }), false],
    [1 / 365 / 24 / 60, Duration.fromObject({ minutes: 1 }), false],
    [1 / 365 / 24 / 60 / 2, Duration.fromObject({ seconds: 30 }), false],
    [1 / 365 / 24 / 60 / 4, Duration.fromObject({ seconds: 15 }), false],
    [1 / 365 / 24 / 60 / 6, Duration.fromObject({ seconds: 10 }), false],
    [1 / 365 / 24 / 60 / 12, Duration.fromObject({ seconds: 5 }), false],
    [1 / 365 / 24 / 60 / 60, Duration.fromObject({ seconds: 1 }), false],
  ];

  // let closestInd = 0;
  const index = increments.findIndex((inc) => inc[0] < yearInc) - 1;
  //   if (
  //     Math.abs(yearInc - inc[0]) < Math.abs(yearInc - increments[closestInd][0])
  //   ) {
  //     closestInd = i;
  //     return false;
  //   }
  //   return true;
  // });

  let ret = increments.slice(0, index + 1).map((
    [inc, duration, showPrev],
  ) => ({
    inc,
    duration,
    showPrev,
  }));
  // console.log(ret);
  return ret;
};

export const setScale = (n: number) => {
  if (n >= 1) {
    scale = n;
  }
};

export const setOffset = (n: number) => {
  const minOffset = secondsToOffsetInPixels(YEAR_RANGE[0] - YEAR_PADDING) +
    offset;
  const maxOffset = secondsToOffsetInPixels(YEAR_RANGE[1] + YEAR_PADDING) -
    innerWidth + offset;
  offset = Math.max(Math.min(n, maxOffset), minOffset);
};

export const render = () => {
  saveLocation();
  updateContent();
  updateMainline();
  updateEvents();
  updateDatetimeMarkers();
};

const saveLocation = () => {
  localStorage.setItem(
    "offset",
    offset.toString(10),
  );
  localStorage.setItem("scale", scale.toString(10));
};

const updateContent = () => {
  content.innerHTML = ``;
  content.style.width = `${secondsToPixels(totalSeconds())}px`;
};

const updateMainline = () => {
  const line = document.createElement("div");
  line.className = "mainline";
  line.style.width = `${secondsToPixels(totalSeconds())}px`;
  content.appendChild(line);
};

const updateEvents = () => {
  Object.entries(window.timelineEvents).forEach(([id, event]) => {
    if (event) {
      if (event.start === event.end) {
        addEvent(id, event, "both");
      } else {
        addEvent(id, event, "start");
        addEvent(id, event, "end");
      }
    }
  });
};

const hash = (str: string) => {
  return (str.split("").reduce((t, v) => t + v.charCodeAt(0), 0) % 47) / 46;
};

const addEvent = (
  id: string,
  event: TimelineEvent,
  part: "start" | "end" | "both",
) => {
  const seconds = part === "start" ? event.start : event.end;
  const prefix = part === "start" ? "Begin: " : (part === "end" ? "End: " : "");
  const lineHeight = hash(event.name) * 50;

  const eventCardElement = createEventCardElement(
    prefix + event.name,
    seconds,
    lineHeight,
  );
  eventCardElement.addEventListener("pointerdown", stopPropagation);
  eventCardElement.addEventListener("pointerup", stopPropagation);
  eventCardElement.addEventListener(
    "click",
    () => displayEvent(id, event, part),
  );

  content.appendChild(eventCardElement);

  const eventLineElement = createEventLineElement(seconds, lineHeight);
  content.appendChild(eventLineElement);
};

const createEventCardElement = (
  name: string,
  seconds: number,
  lineHeight: number,
) => {
  const html = compileEventCardHTML(name, seconds);

  const text = document.createElement("div");
  text.innerHTML = html;
  text.className = "eventtext card";
  text.style.left = `calc(${secondsToOffsetInPixels(seconds)
    }px - (var(--event-width) / 2))`;
  text.style.top =
    `calc(var(--main-line-top) - ${lineHeight}vh - var(--event-height))`;

  return text;
};

const compileEventCardHTML = (
  name: string,
  seconds: number,
) =>
  shtml`<div>${name}</div>
<div>${formatSeconds(seconds)}</div>`;

const createEventLineElement = (seconds: number, lineHeight: number) => {
  const line = document.createElement("div");
  line.className = "eventline";
  line.style.height = `${lineHeight}vh`;
  line.style.left = `${secondsToOffsetInPixels(seconds)}px`;
  line.style.top = `calc(var(--main-line-top) - ${lineHeight}vh)`;
  return line;
};

const updateDatetimeMarkers = () => {
  const yearIncrements = getYearIncrements().slice(-2);

  const addedAt = new Set<number>();

  let start = yearIncrements[1]?.showPrev ? 0 : 1;
  if (yearIncrements[1] === undefined) {
    start = 0;
  }

  for (let i = start; i < 2; i++) {
    const yearInc = yearIncrements[i]?.duration;
    if (!yearInc) {
      continue;
    }
    const minViewSeconds = pixelToSecondsOffset(0 - 100);
    const maxViewSeconds = pixelToSecondsOffset(innerWidth + 100);

    const minViewSecondsRounded = roundSecondsUsingDuration(
      minViewSeconds,
      yearInc,
      Math.floor,
    );
    const maxViewSecondsRounded = roundSecondsUsingDuration(
      maxViewSeconds,
      yearInc,
      Math.ceil,
    );

    const extraHeight = (2 - i - 1) * 0;

    for (
      let datetime = DateTime.fromSeconds(minViewSecondsRounded);
      datetime.toSeconds() <= maxViewSecondsRounded;
      datetime = datetime.plus(yearInc)
    ) {
      if (addedAt.has(datetime.toSeconds())) {
        continue;
      }
      addedAt.add(datetime.toSeconds());
      const yearText = document.createElement("div");
      yearText.textContent = formatSeconds(datetime.toSeconds(), yearInc);
      yearText.className = "year";
      yearText.style.top = `calc(${15 + extraHeight}px + var(--main-line-top))`;
      yearText.style.left = `calc(${secondsToOffsetInPixels(datetime.toSeconds())
        }px - 4rem)`;
      yearText.addEventListener("pointerdown", stopPropagation);
      yearText.addEventListener("pointerup", stopPropagation);
      content.appendChild(yearText);

      const yearLine = document.createElement("div");
      yearLine.className = "yearline";
      yearLine.style.height = `${10 + extraHeight}px`;
      // yearLine.style.top = `70vh`;
      yearLine.style.left = `${secondsToOffsetInPixels(datetime.toSeconds())
        }px`;
      content.appendChild(yearLine);
    }
  }
};

const roundSecondsUsingDuration = (
  seconds: number,
  duration: Duration,
  roundingFunc: (v: number) => number,
) => {
  const datetime = DateTime.fromSeconds(seconds);
  if (duration.get("years") >= 1) {
    return DateTime.fromObject({
      year: roundingFunc(datetime.get("year") / duration.get("year")) *
        duration.get("year"),
    }).toSeconds();
  }
  if (duration.months >= 1) {
    const month = roundingFunc(datetime.get("month") / duration.months) *
      duration.months;
    return DateTime.fromObject({
      year: datetime.get("year"),
      month: 1,
    }).plus({ months: month }).toSeconds();
  }

  if (duration.weeks >= 1) {
    const weekNumber =
      roundingFunc(datetime.get("weekNumber") / duration.weeks) *
      duration.weeks;
    return DateTime.fromObject({
      weekYear: datetime.get("weekYear"),
      weekNumber: 1,
      weekday: 1,
    }).plus({ weeks: weekNumber - 1 }).toSeconds();
  }

  if (duration.days >= 1) {
    const day = roundingFunc(datetime.get("day") / duration.days) *
      duration.days;
    return DateTime.fromObject({
      year: datetime.get("year"),
      month: datetime.get("month"),
      day: 1,
    }).plus({ days: day - 1 }).toSeconds();
  }

  if (duration.hours >= 1) {
    const hours = roundingFunc(datetime.get("hour") / duration.hours) *
      duration.hours;
    return DateTime.fromObject({
      year: datetime.get("year"),
      month: datetime.get("month"),
      day: datetime.get("day"),
      hour: 0,
    }).plus({ hours: hours }).toSeconds();
  }

  if (duration.minutes >= 1) {
    const minutes = roundingFunc(datetime.get("minute") / duration.minutes) *
      duration.minutes;
    return DateTime.fromObject({
      year: datetime.get("year"),
      month: datetime.get("month"),
      day: datetime.get("day"),
      hour: datetime.get("hour"),
      minute: 0,
    }).plus({ minutes: minutes }).toSeconds();
  }

  if (duration.seconds >= 1) {
    const seconds = roundingFunc(datetime.get("second") / duration.seconds) *
      duration.seconds;
    return DateTime.fromObject({
      year: datetime.get("year"),
      month: datetime.get("month"),
      day: datetime.get("day"),
      hour: datetime.get("hour"),
      minute: datetime.get("minute"),
      second: 0,
    }).plus({ seconds: seconds }).toSeconds();
  }

  throw Error();
};
