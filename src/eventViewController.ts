import { TimelineEvent } from "./types.ts";
import { eventViewer } from "./elements.ts";
import { formatSeconds, partToPrefix, shtml, stopPropagation } from "./util.ts";
import { displayDialog, startEventUpdate } from "./eventEditorController.ts";

let currentEvent: {
    id: string;
    event: TimelineEvent;
    part: 'start' | 'end' | 'both'
} | undefined;

export const displayEvent = (
    id: string,
    event: TimelineEvent,
    part: "start" | "end" | "both",
) => {
    currentEvent = { id, event, part };
    updateDisplayedEvent();
};

export const updateDisplayedEvent = () => {
    if (!currentEvent) return;
    const { id, part } = currentEvent;
    const event = window.timelineEvents[id];
    if (!event) {
        currentEvent = undefined;
        closeEventView();
        return;
    }
    currentEvent.event = event;
    const prefix = partToPrefix(part);
    const date = part === "end" ? event.end : event.start;
    eventViewer.name.textContent = prefix + event.name;
    if (part === "both") {
        eventViewer.period.textContent = formatSeconds(event.start);
    } else {
        eventViewer.period.textContent = `${formatSeconds(event.start)} - ${formatSeconds(event.end)
            }`;
    }
    eventViewer.tags.textContent = event.tags;
    eventViewer.concurrentEvents.innerHTML =
        (Object.values(window.timelineEvents) as TimelineEvent[])
            .filter(({ start, end }) => start < date && end > date)
            .map((v) =>
                shtml`<li>${v.name} (${formatSeconds(v.start)} ${v.start !== v.end ? `- ${formatSeconds(v.end)}` : ""
                    })</li>`
            )
            .join("\n");
    eventViewer.dialog.style.visibility = "visible";
    eventViewer.dialog.style.opacity = "1";
}

export const closeEventView = () => {
    eventViewer.dialog.style.visibility = "hidden";
    eventViewer.dialog.style.opacity = "0";
};

eventViewer.edit.addEventListener("click", () => {
    if (currentEvent) {
        startEventUpdate(currentEvent.id, currentEvent.event);
    }
});

eventViewer.dialog.addEventListener("click", () => {
    closeEventView();
});

eventViewer.card.addEventListener("click", stopPropagation);
eventViewer.card.addEventListener("scroll", stopPropagation);
eventViewer.card.addEventListener("wheel", stopPropagation);

addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && !displayDialog) {
        closeEventView();
    }
});

eventViewer.close.addEventListener("click", closeEventView);
