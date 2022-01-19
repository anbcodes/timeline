import { YEAR_RANGE } from "./consts.ts";
import { content } from "./elements.ts";
import { formatYear, stopPropagation } from "./util.ts";
import { TimelineEvent } from "./types.ts";
import { startEventUpdate } from "./eventEditorController.ts";
import { makeNoise2D } from "https://deno.land/x/open_simplex_noise/mod.ts";

declare global {
  interface Window {
    timelineEvents: Record<string, TimelineEvent | undefined>;
  }
}

export let scale = +(localStorage.getItem("scale") || 1);

const noise = makeNoise2D(272727);

const calcYearInc = () => {
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
  ];
  let closest = 2000;
  increments.forEach((inc) => {
    if (Math.abs(yearInc - inc) < Math.abs(yearInc - closest)) {
      closest = inc;
    }
  });
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
  html += `<div>${formatYear(date)}</div>`;

  html += '<div class="hover">';
  const events = (Object.values(window.timelineEvents) as TimelineEvent[])
    .filter((v) => v.start < date && v.end > date).map((v) =>
      `<li>${v.name} (${formatYear(v.start)} - ${formatYear(v.end)})</li>`
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

const hash = (str: string) => {
  let h = 1779033703 ^ str.length;
  for (let i = 0, h = 1779033703 ^ str.length; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = h << 13 | h >>> 19;
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
};

const makeEvent = (
  year: number,
  id: number,
  event: TimelineEvent,
  part?: "start" | "end",
) => {
  const eventPosStartPercent = (year - YEAR_RANGE[0]) /
    (YEAR_RANGE[1] - YEAR_RANGE[0]);

  const line = document.createElement("div");
  line.className = "eventline";
  const height = (noise(year, 0) + 1) / 2 * 50;
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

  const vwMin = (document.documentElement.scrollLeft - 100) /
    document.documentElement.clientWidth;

  const vwMax =
    (document.documentElement.scrollLeft + window.screen.width + 100) /
    document.documentElement.clientWidth;

  for (let year = YEAR_RANGE[0]; year < YEAR_RANGE[1]; year += yearInc) {
    if (year < YEAR_RANGE[0] + 500 || year > YEAR_RANGE[1] - 500) {
      continue;
    }

    const pos = (year - YEAR_RANGE[0]) /
      (YEAR_RANGE[1] - YEAR_RANGE[0]);
    if (pos * scale < vwMax && pos * scale > vwMin) {
      const yearText = document.createElement("div");
      yearText.textContent = `${Math.round(Math.abs(year) * 10) / 10} ${
        year >= 0 ? "AD" : "BC"
      }`;
      yearText.className = "year";
      yearText.style.left = `calc(${pos * scale * 100}vw - 2.5rem)`;
      yearText.addEventListener("pointerdown", stopPropagation);
      yearText.addEventListener("pointerup", stopPropagation);
      content.appendChild(yearText);

      const yearLine = document.createElement("div");
      yearLine.className = "eventline";
      yearLine.style.height = "4vh";
      yearLine.style.top = `70vh`;
      yearLine.style.left = `${pos * scale * 100}vw`;
      content.appendChild(yearLine);
    }
  }
};
