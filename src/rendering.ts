import { YEAR_RANGE } from "./consts.ts";
import { content } from "./elements.ts";
import { formatDate, stopPropagation, yearSeconds } from "./util.ts";
import { TimelineEvent } from "./types.ts";
import { startEventUpdate } from "./eventEditorController.ts";
import { makeNoise2D } from "https://deno.land/x/open_simplex_noise/mod.ts";
import { DateTime } from "https://cdn.skypack.dev/luxon?dts";

declare global {
  interface Window {
    timelineEvents: Record<string, TimelineEvent | undefined>;
  }
}

export let scale = +(localStorage.getItem("scale") || 1);

const noise = makeNoise2D(272727);

export const calcYearInc = () => {
  let yearInc = 2000;
  const fiveXs = Math.floor(scale / 3);
  yearInc = yearInc / 2 / fiveXs;
  const increments = [
    2000,
    1000,
    500,
    250,
    100,
    50,
    25,
    10,
    5,
    2,
    1,
    1 / 12,
    1 / 365,
  ];
  let closestNum = 2000;
  increments.forEach((inc) => {
    if (Math.abs(yearInc - inc) < Math.abs(yearInc - closestNum)) {
      closestNum = inc;
    }
  });
  let closest: number | string = closestNum;
  if (closest === 1 / 12) {
    closest = "month";
  } else if (closest === 1 / 365) {
    closest = "day";
  }
  return closest;
};

export const setScale = (n: number) => {
  if (n >= 1) {
    scale = n;
    render();
  }
};

const compileEventToHTML = (
  event: TimelineEvent,
  part?: "start" | "end",
) => {
  const prefix = part === "start" ? "Begin: " : part === "end" ? "End: " : "";
  const date = part === "start" ? event.start : event.end;
  let html = "";
  html += `<div>${prefix}${event.name}</div>`;
  html += `<div>${formatDate(date)}</div>`;

  html += '<div class="hover">';
  const events = (Object.values(window.timelineEvents) as TimelineEvent[])
    .filter((v) => v.start < date && v.end > date).map((v) =>
      `<li>${v.name} (${formatDate(v.start)} - ${formatDate(v.end)})</li>`
    );
  if (events.length !== 0) {
    html += "<div>During:</div>";
    html += "<ul>";
    html += events.join("\n");
    html += "</ul>";
  }

  html += "</div>";

  return html;
};

const makeEvent = (
  time: number,
  id: number,
  event: TimelineEvent,
  part?: "start" | "end",
) => {
  const eventPosStartPercent = (time - YEAR_RANGE[0]) /
    (YEAR_RANGE[1] - YEAR_RANGE[0]);

  const line = document.createElement("div");
  line.className = "eventline";
  const height = (noise(time, 0) + 1) / 2 * 50;
  line.style.height = `${height}vh`;
  line.style.left = `${eventPosStartPercent * scale * 100}vw`;
  line.style.top = `${70 - height}vh`;

  const text = document.createElement("div");
  text.innerHTML = compileEventToHTML(event, part);
  text.className = "eventtext";
  text.style.left = `calc(${eventPosStartPercent * scale * 100}vw - 2.5rem)`;
  text.style.top = `calc(${70 - height}vh - 5rem)`;
  text.addEventListener("pointerdown", stopPropagation);
  text.addEventListener("pointerup", stopPropagation);
  text.addEventListener("click", () => startEventUpdate(id, event));

  content.appendChild(line);
  content.appendChild(text);
};

export const render = () => {
  localStorage.setItem(
    "offset",
    document.documentElement.scrollLeft.toString(10),
  );
  localStorage.setItem("scale", scale.toString(10));

  content.innerHTML = ``;
  const line = document.createElement("div");
  line.className = "mainline";

  line.style.width = `${100 * scale}vw`;
  content.style.width = `${100 * scale}vw`;

  Object.entries(window.timelineEvents).forEach(([id, event]) => {
    if (!event) {
      return;
    }

    if (event.start === event.end) {
      makeEvent(event.start, +id, event);
    } else {
      makeEvent(event.start, +id, event, "start");
      makeEvent(event.end, +id, event, "end");
    }
  });
  content.appendChild(line);

  const yearInc = calcYearInc();
  console.log("inc", yearInc);

  const minViewPercent = (document.documentElement.scrollLeft - 100) /
    (document.documentElement.clientWidth * scale);

  const maxViewPercent =
    (document.documentElement.scrollLeft + window.screen.width + 100) /
    (document.documentElement.clientWidth * scale);

  const totalSeconds = (YEAR_RANGE[1] - YEAR_RANGE[0]);

  let yearMin = (minViewPercent * totalSeconds + YEAR_RANGE[0]);
  const yearMax = (maxViewPercent * totalSeconds + YEAR_RANGE[0]);

  const yearMinYears =
    Math.round(DateTime.fromSeconds(yearMin).year / yearInc) *
    yearInc;

  yearMin = DateTime.fromObject({ year: yearMinYears }).toSeconds();

  for (
    let year = DateTime.fromSeconds(yearMin);
    year.toSeconds() < yearMax;
    year = year.plus({ years: yearInc })
  ) {
    if (
      year.minus({ years: 500 }).toSeconds() < YEAR_RANGE[0] ||
      year.plus({ years: 500 }).toSeconds() > YEAR_RANGE[1]
    ) {
      continue;
    }

    const dateLeftPercent = (year.toSeconds() - YEAR_RANGE[0]) /
      (YEAR_RANGE[1] - YEAR_RANGE[0]);
    if (
      dateLeftPercent > minViewPercent &&
      dateLeftPercent < maxViewPercent
    ) {
      const yearText = document.createElement("div");
      yearText.textContent = formatDate(year.toSeconds());
      yearText.className = "year";
      yearText.style.left = `calc(${dateLeftPercent * scale * 100}vw - 2.5rem)`;
      yearText.addEventListener("pointerdown", stopPropagation);
      yearText.addEventListener("pointerup", stopPropagation);
      content.appendChild(yearText);

      const yearLine = document.createElement("div");
      yearLine.className = "eventline";
      yearLine.style.height = "4vh";
      yearLine.style.top = `70vh`;
      yearLine.style.left = `${dateLeftPercent * scale * 100}vw`;
      content.appendChild(yearLine);
    }
  }
};
