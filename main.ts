import {
  Application,
  Context,
  HttpError,
  Router,
  ServerSentEvent,
  Status,
} from "https://deno.land/x/oak@v10.1.0/mod.ts";

export interface TimelineEvent {
  name: string;
  start: number;
  end: number;
  tags: string;
}

const ID_LENGTH = 12;

const dataFile = Deno.args[0];

let users: {
  [username: string]: {
    password: string;
    events: { [id: string]: TimelineEvent };
  };
} = {};

try {
  users = JSON.parse(Deno.readTextFileSync(dataFile));
} catch (e) {
  console.error("invaild or not found users: using empty object", e);
}

const websockets: {
  [username: string]: WebSocket[];
} = {};

const router = new Router();
const app = new Application();

const html = Deno.readTextFileSync("./static/index.html");
const js = Deno.readTextFileSync("./static/index.js");
const css = Deno.readTextFileSync("./static/style.css");

const authenticate = (ctx: Context) => {
  const authorization = ctx.request.headers.get("Authorization");
  console.log(authorization);
  if (authorization && authorization.startsWith("Basic ")) {
    try {
      const [username, password] = atob(authorization.slice(6)).split(":");
      console.log(username, password);
      if (username && password) {
        if (users[username]) {
          if (users[username]?.password === password) {
            return { username, password };
          }
        }
      }
    } catch (e) {
      const error = new HttpError("Authorization required");
      error.status = Status.Unauthorized;
      ctx.response.headers.append("WWW-Authenticate", "Basic");

      throw error;
    }
  }

  const error = new HttpError("Authorization required");
  error.status = Status.Unauthorized;
  ctx.response.headers.append("WWW-Authenticate", "Basic");
  throw error;
};

const parseBodyAsEvent = async (ctx: Context): Promise<TimelineEvent> => {
  try {
    const bodyJson = await ctx.request.body({
      type: "json",
    }).value;
    const { name, start, end, tags } = bodyJson;
    if (
      typeof name === "string" && typeof start === "number" &&
      typeof end === "number" && typeof tags === "string"
    ) {
      return {
        name,
        start,
        end,
        tags,
      };
    } else {
      throw new Error();
    }
  } catch (_) {
    const error = new HttpError("Invaild request body");
    error.status = Status.BadRequest;
    throw error;
  }
};

const getRandomString = (s: number) => {
  const buf = new Uint8Array(s);
  crypto.getRandomValues(buf);
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let ret = "";
  for (let i = 0; i < buf.length; ++i) {
    const ind = Math.floor((buf[i] / 256) * alphabet.length);
    ret += alphabet[ind];
  }
  return ret;
};

const sendEvent = (username: string, name: string, id: string) => {
  websockets[username]?.forEach((v) => {
    v.send(JSON.stringify({
      name,
      id,
    }));
  });

  Deno.writeTextFileSync(dataFile, JSON.stringify(users));
};

router.get("/events.js", (ctx) => {
  const { username } = authenticate(ctx);
  ctx.response.body = `window.timelineEvents = ${
    JSON.stringify(users[username].events)
  };`;
  ctx.response.headers.set("Content-Type", "application/javascript");
});

router.post("/event", async (ctx) => {
  const { username } = authenticate(ctx);
  const event = await parseBodyAsEvent(ctx);
  const id = getRandomString(ID_LENGTH);
  users[username].events[id] = event;
  sendEvent(username, "post", id);
  ctx.response.body = {
    success: true,
  };
});

router.get("/event/:id", (ctx) => {
  const { username } = authenticate(ctx);
  if (ctx.params.id === "NaN") console.error("NaN detected (event get)");
  const event = users[username].events[ctx.params.id];
  ctx.response.body = event;
});

router.put("/event/:id", async (ctx) => {
  const { username } = authenticate(ctx);
  if (ctx.params.id === "NaN") console.error("NaN detected (event put)");
  const newEvent = await parseBodyAsEvent(ctx);
  users[username].events[ctx.params.id] = newEvent;
  sendEvent(username, "put", ctx.params.id);
  ctx.response.body = {
    success: true,
  };
});

router.delete("/event/:id", (ctx) => {
  const { username } = authenticate(ctx);
  if (ctx.params.id === "NaN") console.error("NaN detected (event delete)");
  delete users[username].events[ctx.params.id];
  sendEvent(username, "delete", ctx.params.id);
  ctx.response.body = {
    success: true,
  };
});

router.get("/ws", (ctx) => {
  const { username } = authenticate(ctx);
  if (!websockets[username]) {
    websockets[username] = [];
  }
  const socket = ctx.upgrade();
  websockets[username].push(socket);
  socket.addEventListener("close", () => {
    websockets[username] = websockets[username].filter((v) => v !== socket);
  });
});

//error handler
app.use(async (context, next) => {
  try {
    await next();
  } catch (e) {
    if (e instanceof HttpError) {
      // deno-lint-ignore no-explicit-any
      context.response.status = e.status as any;
      if (e.expose) {
        context.response.body = `${e.status} - ${e.message}`;
      } else {
        context.response.body = `${e.status} - ${Status[e.status]}`;
      }
    } else if (e instanceof Error) {
      context.response.status = 500;
      context.response.body = `500 - Internal Server Error`;
      console.log("Unhandled Error:", e.message);
      console.log(e.stack);
    }
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

app.use(async (ctx, next) => {
  const root = `${Deno.cwd()}/static`;
  try {
    await ctx.send({ root, index: "index.html" });
  } catch {
    next();
  }
});

app.use((ctx) => {
  ctx.response.status = Status.NotFound;
  ctx.response.body = `"${ctx.request.url}" not found`;
});

app.addEventListener(
  "listen",
  ({ port }) => console.log(`listening on port: ${port}`),
);

app.listen({ hostname: "0.0.0.0", port: +(Deno.args[1] || 8080) });
