import { render } from "./rendering.ts";
import { addButton } from "./elements.ts";
import { startEventCreation } from "./eventEditorController.ts";
import "./grabbing.ts";
import "./zooming.ts";
import "./server.ts";
import "./eventEditorController.ts";

const offset = +(localStorage.getItem("offset") ?? NaN);
console.log(offset);
if (!isNaN(offset)) {
  setTimeout(() => {
    window.scrollTo(offset, 0);
  }, 10);
}

addEventListener("scroll", () => {
  render();
});

render();

addButton.addEventListener("click", startEventCreation);

console.log(
  "Hello! Welcome to the console! I wrote this project with Deno and the only library I used was oak for the server. I hope you like it :)",
);

console.log();
