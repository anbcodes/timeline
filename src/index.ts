import { offset, render, setOffset } from "./rendering.ts";
import { addButton } from "./elements.ts";
import { startEventCreation } from "./eventEditorController.ts";
import "./grabbing.ts";
import "./zooming.ts";
import "./server.ts";
import "./eventEditorController.ts";
import { DateTime } from "luxon";

const date = DateTime.fromObject({
  year: -1100,
});
console.log(date.toSeconds());

const localStorageOffset = +(localStorage.getItem("offset") ?? NaN);
console.log(localStorageOffset);
if (!isNaN(localStorageOffset)) {
  setTimeout(() => {
    setOffset(localStorageOffset);
  }, 10);
}

addEventListener("scroll", () => {
  render();
});

render();

addButton.addEventListener("click", startEventCreation);

console.log(
  "Hello! Welcome to the console! I wrote this project with using Deno and typescript. I hope you like it :)",
);

console.log();

addEventListener("resize", () => {
  setOffset(offset);
  render();
});
