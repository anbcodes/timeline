import { content } from "./elements.ts";

let mouseX = 0;
let dragging = false;
let dragVel = 0;

const dragFrame = () => {
  if (dragVel !== 0 && !dragging) {
    window.scrollTo(document.documentElement.scrollLeft + dragVel, 0);
    dragVel += dragVel > 0 ? -2 : 2;
  }

  if (Math.abs(dragVel) <= 2) {
    dragVel = 0;
  }
  requestAnimationFrame(dragFrame);
};

requestAnimationFrame(dragFrame);

content.addEventListener("pointermove", (ev) => {
  if (dragging) {
    const dx = mouseX - ev.x;
    dragVel = dx;
    window.scrollTo(document.documentElement.scrollLeft + dx, 0);
  }

  mouseX = ev.x;
});

content.addEventListener("pointerdown", () => {
  dragging = true;
  content.style.cursor = "grabbing";
});

content.addEventListener("pointerup", () => {
  dragging = false;
  content.style.cursor = "grab";
});
