import { render } from "./rendering.ts";
import { TimelineEvent } from "./types.ts";

declare global {
  interface Window {
    timelineEvents: Record<number, TimelineEvent | undefined>;
  }
}

const eventSource = new EventSource("/api/sse");

eventSource.addEventListener("event-create", async (event) => {
  const ev = event as MessageEvent;
  const id = +ev.data;
  if (isNaN(id)) {
    console.log("received an invaild id!");
    return;
  }
  const res = await fetch(`/api/event/${id}`);
  const timelineEvent = await res.json();
  if (
    timelineEvent.name !== undefined && timelineEvent.start !== undefined &&
    timelineEvent.end !== undefined && timelineEvent.tags !== undefined &&
    timelineEvent.visible !== undefined
  ) {
    window.timelineEvents[id] = timelineEvent;
    console.log("Add event", id);
    render();
  } else {
    console.error("Recieved an invaild timeline event", timelineEvent);
  }
});

eventSource.addEventListener("event-update", async (event) => {
  const ev = event as MessageEvent;
  const id = +ev.data;
  if (isNaN(id)) {
    console.log("received an invaild id!");
    return;
  }
  const res = await fetch(`/api/event/${id}`);
  const timelineEvent = await res.json();
  if (
    timelineEvent.name !== undefined && timelineEvent.start !== undefined &&
    timelineEvent.end !== undefined && timelineEvent.tags !== undefined &&
    timelineEvent.visible !== undefined
  ) {
    window.timelineEvents[id] = timelineEvent;
    console.log("Update event", ev.data);
    render();
  } else {
    console.error("Recieved an invaild timeline event", timelineEvent);
  }
});

eventSource.addEventListener("event-delete", (ev) => {
  const id = +((ev as MessageEvent).data);
  delete window.timelineEvents[id];
  console.log("Delete event", id);
  render();
});

export const addEvent = async (ev: TimelineEvent) => {
  const res = await fetch("/api/event", {
    method: "POST",
    body: JSON.stringify(ev),
  });

  return res.json();
};

export const updateEvent = async (id: number, ev: TimelineEvent) => {
  const res = await fetch(`/api/event/${id}`, {
    method: "PUT",
    body: JSON.stringify(ev),
  });

  return res.json();
};

export const getEvent = async (id: number) => {
  const res = await fetch(`/api/event/${id}`, {
    method: "GET",
  });

  return res.json();
};

export const removeEvent = async (id: number) => {
  const res = await fetch(`/api/event/${id}`, {
    method: "DELETE",
  });

  return res.json();
};
