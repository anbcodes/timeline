import { eventEditor } from "./elements.ts";
import { stopPropagation } from "./util.ts";
import { TimelineEvent } from "./types.ts";
import { addEvent, removeEvent, updateEvent } from "./server.ts";
import { DateTime } from "https://cdn.skypack.dev/luxon?dts";

let displayDialog = false;
let currentlyEditing: (TimelineEvent & { id?: number }) | undefined;

export const startEventCreation = () => {
  displayDialog = true;
  eventEditor.error.textContent = "";
  currentlyEditing = {
    name: "",
    start: +(localStorage.getItem('startSeconds') || 0),
    end: +(localStorage.getItem('endSeconds') || 0),
    tags: [],
  };
  updateDisplay();
};

export const startEventUpdate = (id: number, event: TimelineEvent) => {
  displayDialog = true;
  eventEditor.error.textContent = "";
  currentlyEditing = {
    ...event,
    id,
  };
  updateDisplay();
};

const formatDate = (seconds: number) => {
  let datetime = DateTime.fromSeconds(seconds);
  if (datetime.get('year') <= 0) {
    datetime = datetime.set({
      year: -datetime.get('year') + 1
    })
  }

  return datetime.toISO({includeOffset: false});
}

const updateDisplay = () => {
  if (displayDialog) {
    eventEditor.dialog.style.opacity = "1";
    eventEditor.dialog.style.visibility = "visible";
  } else {
    eventEditor.dialog.style.opacity = "0";
    eventEditor.dialog.style.visibility = "hidden";
  }

  if (currentlyEditing) {
    eventEditor.name.value = currentlyEditing.name;
    // TODO: Implement the ui
    eventEditor.start.value = formatDate(currentlyEditing.start);
    eventEditor.end.value = formatDate(currentlyEditing.end);
    eventEditor.startBCAD.textContent = DateTime.fromSeconds(currentlyEditing.start).get('year') > 0 ? 'AD' : 'BC'
    eventEditor.endBCAD.textContent = DateTime.fromSeconds(currentlyEditing.end).get('year') > 0 ? 'AD' : 'BC'
    eventEditor.tags.value = currentlyEditing.tags.join(", ");

    if (currentlyEditing.id === undefined) {
      eventEditor.delete.style.visibility = "hidden";
    } else {
      eventEditor.delete.style.visibility = "visible";
    }
  }
};

const parseYear = (year: string, part: string): number => {
  let datetime = DateTime.fromISO(year);

  if (part === 'BC') {
    datetime = datetime.set({
      year: -datetime.get('year') + 1
    })
  }

  return datetime.toSeconds();
};

const updateCurrentlyEditing = (): string => {
  const name = eventEditor.name.value;
  const start = parseYear(eventEditor.start.value, eventEditor.startBCAD.textContent || 'AD');
  if (isNaN(start)) {
    return "Invaild start year: " + eventEditor.start.value;
  }

  const end = parseYear(eventEditor.end.value,  eventEditor.endBCAD.textContent || 'AD');
  if (isNaN(end)) {
    return "Invaild end year: " + eventEditor.end.value;
  }

  if (end < start) {
    return "Invaild dates: the end date cannot be less then the start date"
  }

  const tags = eventEditor.tags.value.split(",").map((v) => v.trim());

  currentlyEditing = {
    id: currentlyEditing?.id,
    name,
    start,
    end,
    tags,
  };
  localStorage.setItem('startSeconds', currentlyEditing.start.toString(10));
  localStorage.setItem('endSeconds', currentlyEditing.end.toString(10));
  return "";
};

eventEditor.dialog.addEventListener("click", () => {
  displayDialog = false;
  updateDisplay();
});

eventEditor.form.addEventListener("click", stopPropagation);
addEventListener("keydown", (ev) => {
  if (ev.key === "Escape") {
    displayDialog = false;
    updateDisplay();
  }
});

eventEditor.submit.addEventListener("click", () => {
  if (currentlyEditing === undefined) {
    console.error("Currently editing is undefined");
    return;
  }
  const error = updateCurrentlyEditing();
  if (error !== "") {
    eventEditor.error.textContent = error;
    return;
  }

  const id = currentlyEditing?.id;
  if (id === undefined) {
    addEvent(currentlyEditing);
  } else {
    updateEvent(id, currentlyEditing);
  }

  displayDialog = false;
  updateDisplay();
});

eventEditor.cancel.addEventListener("click", () => {
  displayDialog = false;
  updateDisplay();
});

eventEditor.delete.addEventListener("click", () => {
  const id = currentlyEditing?.id;
  if (id === undefined) {
    eventEditor.error.textContent = "Can't event: No event or no id found";
    return;
  }
  removeEvent(id);
  displayDialog = false;
  updateDisplay();
});

eventEditor.startBCAD.addEventListener("click", () => {
  if (eventEditor.startBCAD.textContent === 'BC') {
    eventEditor.startBCAD.textContent = 'AD';
  } else {
    eventEditor.startBCAD.textContent = 'BC';
  }
})

eventEditor.endBCAD.addEventListener("click", () => {
  if (eventEditor.endBCAD.textContent === 'BC') {
    eventEditor.endBCAD.textContent = 'AD';
  } else {
    eventEditor.endBCAD.textContent = 'BC';
  }
})