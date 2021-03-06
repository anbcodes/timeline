const ensure = <T extends HTMLElement>(q: string) => {
  const element = document.querySelector(q);
  if (element === null) {
    throw new Error(`Element '${q}' does not exist!`);
  }
  return element as T;
};

export const content = ensure<HTMLDivElement>("#content");
export const addButton = ensure<HTMLButtonElement>("#add");
export const eventEditor = {
  form: ensure<HTMLDivElement>("#event-edit-form"),
  dialog: ensure<HTMLDivElement>("#event-edit-dialog"),
  name: ensure<HTMLInputElement>("#event-edit-name"),
  start: ensure<HTMLInputElement>("#event-edit-start"),
  startBCAD: ensure<HTMLButtonElement>("#start-BC-AD-button"),
  end: ensure<HTMLInputElement>("#event-edit-end"),
  endBCAD: ensure<HTMLButtonElement>("#end-BC-AD-button"),
  tags: ensure<HTMLInputElement>("#event-edit-tags"),
  error: ensure<HTMLDivElement>("#event-edit-error"),
  submit: ensure<HTMLButtonElement>("#event-edit-submit"),
  cancel: ensure<HTMLButtonElement>("#event-edit-cancel"),
  delete: ensure<HTMLButtonElement>("#event-edit-delete"),
  title: ensure<HTMLDivElement>("#event-edit-title"),
};

export const eventViewer = {
  dialog: ensure<HTMLDivElement>("#event-view-dialog"),
  card: ensure<HTMLDivElement>("#event-view-card"),
  name: ensure<HTMLDivElement>("#event-view-name"),
  period: ensure<HTMLDivElement>("#event-view-period"),
  tags: ensure<HTMLDivElement>("#event-view-tags"),
  concurrentEvents: ensure<HTMLUListElement>("#event-view-concurrent-events"),
  edit: ensure<HTMLDivElement>("#event-view-edit"),
  close: ensure<HTMLDivElement>("#event-view-close"),
};
