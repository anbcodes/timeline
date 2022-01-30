import { DateTime } from "https://cdn.skypack.dev/luxon?dts";

interface OldTimelineEvent {
    start: number,
    end: number,
    tags: string[],
    name: string,
    visible: number,
}

interface TimelineEvent {
    name: string;
    start: number;
    end: number;
    tags: string;
}

const getRandomString = (s: number) => {
    const buf = new Uint8Array(s);
    crypto.getRandomValues(buf);
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let ret = "";
    for (let i = 0; i < buf.length; ++i) {
        const ind = Math.floor((buf[i] / 256) * alphabet.length)
        ret += alphabet[ind]
    }
    return ret;
}

const org = JSON.parse(Deno.readTextFileSync(Deno.args[0])) as { [id: number]: OldTimelineEvent };

const updated: { [id: string]: TimelineEvent } = {};

Object.values(org).forEach(value => {
    const newId = getRandomString(12);
    const startConverted = value.start < 0 ? value.start + 1 : value.start;
    const endConverted = value.end < 0 ? value.end + 1 : value.end;
    updated[newId] = {
        name: value.name,
        start: DateTime.fromObject({
            year: startConverted,
        }).toSeconds() + 2,
        end: DateTime.fromObject({ year: endConverted }).toSeconds() + 2,
        tags: value.tags.join(', '),
    }
});

Deno.writeTextFileSync(Deno.args[1], JSON.stringify({
    'dev': {
        password: 'dev',
        events: updated
    }
}))