import { ZOOM_SPEED } from "./consts.ts";
import { scale, setScale } from "./rendering.ts";

let mouseX = 0;

addEventListener("pointermove", (ev) => {
  mouseX = ev.x;
});

addEventListener("wheel", (ev) => {
  const scrollLeft = window.document.documentElement.scrollLeft;
  if (ev.deltaY < 0) {
    const totalTimelinePx = window.document.documentElement.clientWidth;
    const offsetPercent = (mouseX + scrollLeft) / totalTimelinePx;
    const newTotalTimelinePx = (totalTimelinePx / scale) * (scale * ZOOM_SPEED);
    const newOffset = offsetPercent * newTotalTimelinePx;
    const newPos = newOffset - mouseX;
    setScale(scale * ZOOM_SPEED);
    window.scrollTo(newPos, 0);
  } else {
    const totalTimelinePx = window.document.documentElement.clientWidth;
    const offsetPercent = (mouseX + scrollLeft) / totalTimelinePx;
    const newTotalTimelinePx = (totalTimelinePx / scale) * (scale / ZOOM_SPEED);
    const newOffset = offsetPercent * newTotalTimelinePx;
    const newPos = newOffset - mouseX;
    setScale(scale / ZOOM_SPEED);
    window.scrollTo(newPos, 0);
  }
});
