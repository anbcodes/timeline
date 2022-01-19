FROM denoland/deno:1.17.3
EXPOSE 8080

WORKDIR /app

ADD . .

RUN deno cache --no-check=remote main.ts

RUN deno bundle -c ./deno.jsonc ./src/index.ts ./static/index.js

CMD ["run", "--no-check=remote", "--allow-env", "--allow-net", "--allow-read=/app,/data", "--allow-write=/data", "main.ts", "/data/events.json"]