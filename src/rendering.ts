import { YEAR_RANGE } from "./consts.ts";
import { content } from "./elements.ts";
import { formatSeconds, stopPropagation } from "./util.ts";
import { TimelineEvent } from "./types.ts";
import { startEventUpdate } from "./eventEditorController.ts";
import { makeNoise2D } from "https://deno.land/x/open_simplex_noise/mod.ts";
import { DateTime, Duration } from "https://cdn.skypack.dev/luxon?dts";

declare global {
  interface Window {
    timelineEvents: Record<number, TimelineEvent | undefined>;
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
}

const pixelsToSeconds = (pixels: number) => {
  // const totalPixels = innerWidth * scale;
  const totalPixels = secondsToPixels(totalSeconds());
  const pixelsPercent = pixels / totalPixels;
  const seconds = pixelsPercent * totalSeconds();
  return seconds;
}

const secondsToOffsetInPixels = (seconds: number) => {
  return secondsToPixels(seconds - YEAR_RANGE[0]) - offset;
}

// f(sec - start) - offset = pixels
// pixels + offset = f(sec - start)
// af(pixels + offset) = sec - start
// sec = af(pixels + offset) + start

const pixelToSecondsOffset = (pixels: number) => {
  return pixelsToSeconds(pixels + offset) + YEAR_RANGE[0];
}


const noise = makeNoise2D(272727);

export const calcYearInc = () => {
  return getYearIncrements().slice(-1)[0];
}

export const getYearIncrements = () => {
  let yearInc = 2000;
  const fiveXs = Math.floor(scale / 3);
  yearInc = yearInc / 2 / fiveXs;
  const increments: [number, Duration][] = [
    [Infinity, Duration.fromObject({years: 2000})],
    [1000, Duration.fromObject({years: 1000})],
    [500, Duration.fromObject({years: 500})],
    [250, Duration.fromObject({years: 250})],
    [100, Duration.fromObject({years: 100})],
    [50, Duration.fromObject({years: 50})],
    [25, Duration.fromObject({years: 25})],
    [10, Duration.fromObject({years: 10})],
    [5, Duration.fromObject({years: 5})],
    [2, Duration.fromObject({years: 2})],
    [1, Duration.fromObject({years: 1})],
    [1 / 4, Duration.fromObject({months: 3})],
    [1 / 12, Duration.fromObject({months: 1})],
    [1 / 12 / 4, Duration.fromObject({weeks: 1})],
    [1 / 365, Duration.fromObject({days: 1})],
    [1 / 365 / 4, Duration.fromObject({hours: 6})],
    [1 / 365 / 8, Duration.fromObject({hours: 3})],
    [1 / 365 / 24, Duration.fromObject({hours: 1})],
    [1 / 365 / 24 / 2, Duration.fromObject({minutes: 30})],
    [1 / 365 / 24 / 4, Duration.fromObject({minutes: 15})],
    [1 / 365 / 24 / 6, Duration.fromObject({minutes: 10})],
    [1 / 365 / 24 / 12, Duration.fromObject({minutes: 5})],
    [1 / 365 / 24 / 60, Duration.fromObject({minutes: 1})],
    [1 / 365 / 24 / 60 / 2, Duration.fromObject({seconds: 30})],
    [1 / 365 / 24 / 60 / 4, Duration.fromObject({seconds: 15})],
    [1 / 365 / 24 / 60 / 6, Duration.fromObject({seconds: 10})],
    [1 / 365 / 24 / 60 / 12, Duration.fromObject({seconds: 5})],
    [1 / 365 / 24 / 60 / 60, Duration.fromObject({seconds: 1})],
  ];

  // let values = increments.filter(v => v[0] >= yearInc).map(v => v[1]);

  // return values;

  let closestInd = 0;
  increments.forEach((inc, i) => {
    if (Math.abs(yearInc - inc[0]) < Math.abs(yearInc - increments[closestInd][0])) {
      closestInd = i;
    }
  });

  return increments.slice(0, closestInd + 1).map(v => v[1]);
  // let closest: Duration = Duration.fromObject({years: closestNum});
  // if (closestNum === 1 / 4) {
  //   closest = Duration.fromObject({months: 3});
  // } else if (closestNum === 1 / 12) {
  //   closest = Duration.fromObject({months: 1});
  // } else if (closestNum === 1 / 12 / 4) {
  //   closest = Duration.fromObject({weeks: 1});
  // } else if (closestNum === 1 / 365) {
  //   closest = Duration.fromObject({days: 1});
  // } 
  // return closest;
};

const offsetPadding = 60 * 60 * 24 * 365 * 1000;

export const setScale = (n: number) => {
  if (n >= 1) {
    // console.log('scale', scale);
    scale = n;
  }
};

export const setOffset = (n: number) => {
  const minOffset = secondsToOffsetInPixels(YEAR_RANGE[0] - offsetPadding) + offset;
  const maxOffset = secondsToOffsetInPixels(YEAR_RANGE[1] + offsetPadding) - innerWidth + offset;
  // console.log(minOffset, maxOffset);
  offset = Math.max(Math.min(n, maxOffset), minOffset);
  // console.log(minOffset, maxOffset, offset);
  // const secondsRight = pixelOffsetToSeconds(n + innerWidth);
  // const secondsLeft = pixelOffsetToSeconds(n);
  // if (secondsLeft <= YEAR_RANGE[0] - offsetPadding) {
  //   offset = secondsToOffsetInPixels(YEAR_RANGE[0] - offsetPadding);
  // } else if (secondsRight >= YEAR_RANGE[1] + offsetPadding) {
  //   offset = secondsToOffsetInPixels(YEAR_RANGE[1] + offsetPadding);
  // } else {
  //   console.log(secondsRight, secondsLeft, YEAR_RANGE[1] + 60 * 60 * 24 * 365 * 1000, YEAR_RANGE[0] - 60 * 60 * 24 * 365 * 1000);
  //   offset = n;
  //   render();
  // }
};


export const render = () => {
  saveLocation();
  updateContent();
  updateMainline();
  updateEvents();
  updateDatetimeMarkers();
}

const saveLocation = () => {
  localStorage.setItem(
    "offset",
    offset.toString(10),
  );
  localStorage.setItem("scale", scale.toString(10));
}

const updateContent = () => {
  content.innerHTML = ``;
  content.style.width = `${secondsToPixels(totalSeconds())}px`;
}

const updateMainline = () => {
  const line = document.createElement("div");
  line.className = "mainline";
  line.style.width = `${secondsToPixels(totalSeconds())}px`;
  content.appendChild(line);
}

const updateEvents = () => {
  Object.entries(window.timelineEvents).forEach(([id, event]) => {
    if (event) {
      if (event.start === event.end) {
        addEvent(+id, event, 'both')
      } else {
        addEvent(+id, event, 'start');
        addEvent(+id, event, 'end');
      }
    }
  });
}

const addEvent = (id: number, event: TimelineEvent, part: "start" | "end" | "both") => {
  const seconds = part === 'start' ? event.start : event.end;
  const prefix = part === 'start' ? 'Begin: ' : (part === 'end' ? 'End: ' : '');
  const concurrentEvents = (Object.values(window.timelineEvents) as TimelineEvent[]).filter(({start, end}) => start > seconds && end < seconds);
  const lineHeight = (noise(seconds, 0) + 1) / 2 * 50

  const eventCardElement = createEventCardElement(prefix + event.name, seconds, concurrentEvents, lineHeight);
  eventCardElement.addEventListener("pointerdown", stopPropagation);
  eventCardElement.addEventListener("pointerup", stopPropagation);
  eventCardElement.addEventListener("click", () => startEventUpdate(id, event));

  content.appendChild(eventCardElement);

  const eventLineElement = createEventLineElement(seconds, lineHeight);
  content.appendChild(eventLineElement);
}

const createEventCardElement = (name: string, seconds: number, concurrentEvents: TimelineEvent[], lineHeight: number) => {
  const html = compileEventCardHTML(name, seconds, concurrentEvents);

  const text = document.createElement("div");
  text.innerHTML = html;
  text.className = "eventtext";
  text.style.left = `calc(${secondsToOffsetInPixels}px - 2.5rem)`;
  text.style.top = `calc(${70 - lineHeight}vh - 5rem)`;
  

  return text;
}

const compileEventCardHTML = (name: string, seconds: number, concurrentEvents: TimelineEvent[]) => 
`<div>${name}</div>
<div>${formatSeconds(seconds)}</div>
<div class="hover">
  <ul>
  ${
    concurrentEvents
    
    .map(({name, start, end}) => `
    <li>${name} (${formatSeconds(start)} - ${formatSeconds(end)})
    `).join('')
  }
  </ul>
</div>`

const createEventLineElement = (seconds: number, lineHeight: number) => {
  const line = document.createElement("div");
  line.className = "eventline";
  line.style.height = `${lineHeight}vh`;
  line.style.left = `${secondsToOffsetInPixels(seconds)}px`;
  line.style.top = `${70 - lineHeight}vh`;
  return line;
}

const updateDatetimeMarkers = () => {
  const yearIncrements = getYearIncrements().slice(-2);

  const addedAt = new Set<number>();

  for (let i = 0; i < 2; i++) {
    const yearInc = yearIncrements[i]
    if (!yearInc) {
      continue;
    }
    const minViewSeconds = pixelToSecondsOffset(0 - 100);
    const maxViewSeconds = pixelToSecondsOffset(innerWidth + 100);

    const minViewSecondsRounded = roundSecondsUsingDuration(minViewSeconds, yearInc, Math.floor);
    const maxViewSecondsRounded = roundSecondsUsingDuration(maxViewSeconds, yearInc, Math.ceil);

    const extraHeight = (2 - i - 1) * 2;

    for (let datetime = DateTime.fromSeconds(minViewSecondsRounded); datetime.toSeconds() <= maxViewSecondsRounded; datetime = datetime.plus(yearInc)) {
      if (addedAt.has(datetime.toSeconds())) {
        continue
      }
      addedAt.add(datetime.toSeconds());
      const yearText = document.createElement("div");
      yearText.textContent = formatSeconds(datetime.toSeconds(), yearInc);
      yearText.className = "year";
      yearText.style.top = `${75 + extraHeight}vh`
      yearText.style.left = `calc(${secondsToOffsetInPixels(datetime.toSeconds())}px - 2.5rem)`;
      yearText.addEventListener("pointerdown", stopPropagation);
      yearText.addEventListener("pointerup", stopPropagation);
      content.appendChild(yearText);

      const yearLine = document.createElement("div");
      yearLine.className = "eventline";
      yearLine.style.height = `${4 + extraHeight}vh`;
      yearLine.style.top = `70vh`;
      yearLine.style.left = `${secondsToOffsetInPixels(datetime.toSeconds())}px`;
      content.appendChild(yearLine);
    }
  }
}

const roundSecondsUsingDuration = (seconds: number, duration: Duration, roundingFunc: (v: number) => number) => {
  const datetime = DateTime.fromSeconds(seconds);
  if (duration.get('years') >= 1) {
    return DateTime.fromObject({
      year: roundingFunc(datetime.get('year') / duration.get('year')) * duration.get('year'),
    }).toSeconds();
  }
  if (duration.months >= 1) {
    const month = roundingFunc(datetime.get('month') / duration.months) * duration.months;
    return DateTime.fromObject({
      year: datetime.get('year'),
      month: 1,
    }).plus({months: month - 1}).toSeconds();
  }

  if (duration.weeks >= 1) {
    const weekNumber = roundingFunc(datetime.get('weekNumber') / duration.weeks) * duration.weeks;
    return DateTime.fromObject({
      weekYear: datetime.get('weekYear'),
      weekNumber: 1,
      weekday: 1,
    }).plus({weeks: weekNumber - 1}).toSeconds();
  }

  if (duration.days >= 1) {
    const day = roundingFunc(datetime.get('day') / duration.days) * duration.days;
    return DateTime.fromObject({
      year: datetime.get('year'),
      month: datetime.get('month'),
      day: 1
    }).plus({days: day - 1}).toSeconds();
  }

  if (duration.hours >= 1) {
    const hours = roundingFunc(datetime.get('hour') / duration.hours) * duration.hours;
    return DateTime.fromObject({
      year: datetime.get('year'),
      month: datetime.get('month'),
      day: datetime.get('day'),
      hour: 0
    }).plus({hours: hours}).toSeconds();
  }

  if (duration.minutes >= 1) {
    const minutes = roundingFunc(datetime.get('minute') / duration.minutes) * duration.minutes;
    return DateTime.fromObject({
      year: datetime.get('year'),
      month: datetime.get('month'),
      day: datetime.get('day'),
      hour: datetime.get('hour'),
      minute: 0,
    }).plus({minutes: minutes}).toSeconds();
  }

  if (duration.seconds >= 1) {
    const seconds = roundingFunc(datetime.get('second') / duration.seconds) * duration.seconds;
    return DateTime.fromObject({
      year: datetime.get('year'),
      month: datetime.get('month'),
      day: datetime.get('day'),
      hour: datetime.get('hour'),
      minute: datetime.get('minute'),
      second: 0,
    }).plus({seconds: seconds}).toSeconds();
  }

  throw Error();
}