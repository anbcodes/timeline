import { eventEditor } from "./elements.ts";
import { stopPropagation } from "./util.ts";
import { TimelineEvent } from "./types.ts";
import { addEvent, removeEvent, updateEvent } from "./server.ts";

let displayDialog = false;
let currentlyEditing: (TimelineEvent & { id?: number }) | undefined;

export const startEventCreation = () => {
  displayDialog = true;
  eventEditor.error.textContent = "";
  currentlyEditing = {
    name: "",
    start: 0,
    end: 0,
    tags: [],
    visible: 2000,
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
    eventEditor.start.value = currentlyEditing.start.toString(10);
    eventEditor.end.value = currentlyEditing.end.toString(10);
    eventEditor.tags.value = currentlyEditing.tags.join(", ");
    eventEditor.increment.value = currentlyEditing.visible.toString(10);

    if (currentlyEditing.id === undefined) {
      eventEditor.delete.style.visibility = "hidden";
    } else {
      eventEditor.delete.style.visibility = "visible";
    }
  }
};

const parseYear = (year: string): number => {
  const parts = year.split(" ");
  if (parts.length > 2) {
    return NaN;
  }
  const number = +parts[0];
  return parts[1] === "AD" ? number : parts[1] === "BC" ? -number : NaN;
};

const updateCurrentlyEditing = (): string => {
  const name = eventEditor.name.value;
  const start = parseYear(eventEditor.start.value);
  if (isNaN(start)) {
    return "Invaild start year: " + eventEditor.start.value;
  }

  const end = parseYear(eventEditor.end.value);
  if (isNaN(end)) {
    return "Invaild end year: " + eventEditor.end.value;
  }

  const tags = eventEditor.tags.value.split(",").map((v) => v.trim());

  const increment = +eventEditor.increment.value;
  if (isNaN(increment)) {
    return "Invaild increment: " + eventEditor.increment.value;
  }

  currentlyEditing = {
    id: currentlyEditing?.id,
    name,
    start,
    end,
    tags,
    visible: increment,
  };
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
