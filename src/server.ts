import { render } from "./rendering.ts";
import { TimelineEvent } from "./types.ts";

declare global {
  interface Window {
    timelineEvents: Record<number, TimelineEvent | undefined>;
  }
}

const websocket = new WebSocket(`${window.location.protocol === "https:" ? 'wss' : 'ws'}://${window.location.host}/ws`);

websocket.addEventListener('message', async (ev) => {
  const event = JSON.parse(ev.data);

  if (event.name === 'post' || event.name === 'put') {
    const id = event.id;
    const res = await fetch(`/event/${id}`);
    const timelineEvent = await res.json();

    if (
      typeof timelineEvent.name === 'string' && typeof timelineEvent.start === 'number'
      && typeof timelineEvent.end === 'number' && typeof timelineEvent.tags === 'string'
    ) {
      window.timelineEvents[id] = timelineEvent;
      console.log("Add/update event", id);
      render();
    } else {
      console.error("Recieved an invaild timeline event", timelineEvent);
    }
  } else if (event.name === 'delete') {
    const id = event.id;
    delete window.timelineEvents[id];
    console.log('deleted event');
    render();
  }
})

export const addEvent = async (ev: TimelineEvent) => {
  const res = await fetch("/event", {
    method: "POST",
    body: JSON.stringify(ev),
  });

  return res.json();
};

export const updateEvent = async (id: string, ev: TimelineEvent) => {
  const res = await fetch(`/event/${id}`, {
    method: "PUT",
    body: JSON.stringify(ev),
  });

  return res.json();
};

export const getEvent = async (id: string) => {
  const res = await fetch(`/event/${id}`, {
    method: "GET",
  });

  return res.json();
};

export const removeEvent = async (id: string) => {
  const res = await fetch(`/event/${id}`, {
    method: "DELETE",
  });

  return res.json();
};
