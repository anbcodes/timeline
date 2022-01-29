import { TimelineEvent } from './types.ts';
import { eventViewer } from './elements.ts';
import { partToPrefix, formatSeconds, shtml, stopPropagation } from './util.ts';
import { startEventUpdate, displayDialog } from "./eventEditorController.ts";


let currentEvent: {
    id: string,
    event: TimelineEvent
} | undefined;

export const displayEvent = (id: string, event: TimelineEvent, part: 'start' | 'end' | 'both') => {
    currentEvent = {id, event};
    const prefix = partToPrefix(part);
    const date = part === 'end' ? event.end : event.start;
    eventViewer.name.textContent = prefix + event.name;
    if (part === 'both') {
        eventViewer.period.textContent = formatSeconds(event.start);
    } else {
        eventViewer.period.textContent = `${formatSeconds(event.start)} - ${formatSeconds(event.end)}`
    }
    eventViewer.tags.textContent = event.tags;
    eventViewer.concurrentEvents.innerHTML = (Object.values(window.timelineEvents) as TimelineEvent[])
        .filter(({start, end}) => start < date && end > date)
        .map(v => shtml`<li>${v.name} (${formatSeconds(event.start)} ${v.start !== v.end ? `- ${formatSeconds(event.end)}` : ''})</li>`)
        .join('\n')
    eventViewer.dialog.style.visibility = 'visible';
    eventViewer.dialog.style.opacity = '1';
}

export const closeEventView = () => {
    eventViewer.dialog.style.visibility = 'hidden';
    eventViewer.dialog.style.opacity = '0';
}

eventViewer.edit.addEventListener('click', () => {
    if (currentEvent) {
        startEventUpdate(currentEvent.id, currentEvent.event);
    }
})

eventViewer.dialog.addEventListener("click", () => {
    closeEventView();
});

eventViewer.card.addEventListener("click", stopPropagation);
addEventListener("keydown", (ev) => {
  if (ev.key === "Escape" && !displayDialog) {
    closeEventView();
  }
});

eventViewer.close.addEventListener('click', closeEventView);