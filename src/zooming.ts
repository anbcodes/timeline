import { ZOOM_SPEED } from "./consts.ts";
import { scale, setScale, setOffset, offset, render } from "./rendering.ts";

let mouseX = 0;

addEventListener("pointermove", (ev) => {
  mouseX = ev.x;
});

addEventListener("wheel", (ev) => {
  const scrollLeft = offset;
  if (ev.deltaY < 0) {
    const totalTimelinePx = window.document.documentElement.clientWidth;
    const offsetPercent = (mouseX + scrollLeft) / totalTimelinePx;
    const newTotalTimelinePx = (totalTimelinePx / scale) * (scale * ZOOM_SPEED);
    const newOffset = offsetPercent * newTotalTimelinePx;
    const newPos = newOffset - mouseX;
    setScale(scale * ZOOM_SPEED);
    setOffset(newPos);
    // window.scrollTo(newPos, 0);
  } else {
    const totalTimelinePx = window.document.documentElement.clientWidth;
    const offsetPercent = (mouseX + scrollLeft) / totalTimelinePx;
    const newTotalTimelinePx = (totalTimelinePx / scale) * (scale / ZOOM_SPEED);
    const newOffset = offsetPercent * newTotalTimelinePx;
    const newPos = newOffset - mouseX;
    setScale(scale / ZOOM_SPEED);
    setOffset(newPos);
    // window.scrollTo(newPos, 0);
  }
  render();
});
