import {
  Application,
  HttpError,
  Router,
  ServerSentEvent,
  ServerSentEventTarget,
  Status,
} from "https://deno.land/x/oak@v10.1.0/mod.ts";

const app = new Application();
const router = new Router();

const password = Deno.env.get("TIMELINE_PASSWORD");
const username = Deno.env.get("TIMELINE_USERNAME");

if (!password || !username) {
  throw new Error(
    "Username and password required (Specify with TIMELINE_PASSWORD and TIMELINE_USERNAME)",
  );
}

// Error handler middleware
app.use(async (context, next) => {
  try {
    await next();
  } catch (e) {
    if (e instanceof HttpError) {
      // deno-lint-ignore no-explicit-any
      context.response.status = e.status as any;
      if (e.expose) {
        context.response.body = `<!DOCTYPE html>
              <html>
                <body>
                  <h1>${e.status} - ${e.message}</h1>
                </body>
              </html>`;
      } else {
        context.response.body = `<!DOCTYPE html>
              <html>
                <body>
                  <h1>${e.status} - ${Status[e.status]}</h1>
                </body>
              </html>`;
      }
    } else if (e instanceof Error) {
      context.response.status = 500;
      context.response.body = `<!DOCTYPE html>
              <html>
                <body>
                  <h1>500 - Internal Server Error</h1>
                </body>
              </html>`;
      console.log("Unhandled Error:", e.message);
      console.log(e.stack);
    }
  }
});

// Logger
app.use(async (context, next) => {
  await next();
  const rt = context.response.headers.get("X-Response-Time");
  console.log(
    `${context.request.method} ${context.request.url.pathname} - ${String(rt)}`,
  );
});

// Response Time
app.use(async (context, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  context.response.headers.set("X-Response-Time", `${ms}ms`);
});

app.use(async (context, next) => {
  if (
    context.request.headers.get("Authorization") ===
      "Basic " + btoa(`${username}:${password}`)
  ) {
    await next();
  } else {
    context.response.body = "401 - Unauthorized";
    context.response.status = 401;
    context.response.headers.append("WWW-Authenticate", "Basic");
  }
});

interface TimelineEvent {
  name: string;
  start: number;
  end: number;
  tags: string[];
  visible: number;
}

let events: Record<number, TimelineEvent | undefined> = {};

try {
  events = JSON.parse(
    Deno.readTextFileSync(Deno.args[0]),
  );
} catch (e) {
  if (e instanceof Deno.errors.NotFound) {
    console.log("File does not exist. Using empty events dictionary");
  } else {
    console.log("Error parsing events using default object: ", e);
  }
}
const randomUniqueId = () => Math.floor(Math.random() * (2 ** 61));

router.get("/api/events.js", (ctx) => {
  ctx.response.body = "window.timelineEvents = " + JSON.stringify(events);
  ctx.response.headers.append("Content-Type", "application/javascript");
  ctx.response.status = 200;
});

let clients = [] as ServerSentEventTarget[];

router.get("/api/sse", (ctx) => {
  const target = ctx.sendEvents();
  target.addEventListener("close", (evt) => {
    clients.filter((v) => v !== target);
  });
  clients.push(target);
});

const send = (eventName: string, data: any) => {
  Deno.writeTextFile(Deno.args[0], JSON.stringify(events));

  clients = clients.filter((v) => !v.closed);
  clients.forEach((client) => {
    client.dispatchEvent(new ServerSentEvent(eventName, data));
  });
};

router.post("/api/event", async (ctx) => {
  const body = await ctx.request.body({ type: "json" }).value;
  const id = randomUniqueId();
  const event = {
    name: body.name ?? "New Event",
    start: body.start ?? 0,
    end: body.end ?? 0,
    tags: body.tags ?? [],
    visible: body.visible ?? 2000,
  };

  events[id] = event;
  send("event-create", id);

  ctx.response.body = { ...event, id };
  ctx.response.headers.append("Content-Type", "application/json");
});

router.get("/api/event/:id", (ctx) => {
  const event = events[+ctx.params.id];
  if (event === undefined) {
    ctx.response.body = {
      status: 404,
      message: "Event not found",
    };
    ctx.response.status = 404;
    return;
  }
  ctx.response.body = {
    ...event,
    id: +ctx.params.id,
  };
});

router.put("/api/event/:id", async (ctx) => {
  const body = await ctx.request.body({ type: "json" }).value;
  const id = +ctx.params.id;
  if (isNaN(id)) {
    ctx.response.body = {
      status: 400,
      message: "Bad Request: id is required",
    };
    ctx.response.status = 400;
    return;
  }
  const oldEvent = events[id];
  if (!oldEvent) {
    ctx.response.body = {
      status: 400,
      message: "Bad Request: event doesn't exist",
    };
    ctx.response.status = 400;
    return;
  }
  const event = {
    name: body.name ?? oldEvent.name,
    start: body.start ?? oldEvent.start,
    end: body.end ?? oldEvent.end,
    tags: body.tags ?? oldEvent.tags,
    visible: body.visible ?? oldEvent.visible,
  };

  events[id] = event;
  send("event-update", id);

  ctx.response.body = { ...event, id };
  ctx.response.headers.append("Content-Type", "application/json");
});

router.delete("/api/event/:id", (ctx) => {
  const id = +ctx.params.id;
  if (isNaN(id)) {
    ctx.response.body = {
      status: 400,
      message: "Bad Request: id is required",
    };
    ctx.response.status = 400;
    return;
  }
  if (!events[id]) {
    ctx.response.body = {
      status: 400,
      message: "Bad Request: event doesn't exist",
    };
    ctx.response.status = 400;
    return;
  }

  delete events[id];

  send("event-delete", id);

  ctx.response.body = { deleted: true };
});

router.get("/api/log/:text", (ctx) => {
  console.log("Server log message:", ctx.params.text);
  ctx.response.body = "Success";
});

app.use(router.routes());
app.use(router.allowedMethods());

// Send static content
app.use(async (context) => {
  await context.send({
    root: `${Deno.cwd()}/static`,
    index: "index.html",
  });
});

app.addEventListener("listen", ({ hostname, port, serverType }) => {
  console.log(
    "Start listening on " + `${hostname}:${port}`,
  );
  console.log("  using HTTP server: " + serverType);
});

await app.listen({ hostname: "0.0.0.0", port: 8080 });
