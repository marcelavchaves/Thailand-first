import { announce } from "../lib/updates";
import { canEditAnnouncements, hasTDSession, sameOrigin } from "../lib/td-auth";
import { getStore } from "@netlify/blobs";
import type { Config, Context } from "@netlify/functions";

type XavierNote = {
  tripDate: number;
  text: string;
  updatedAt: string;
};

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function clean(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function validDay(value: unknown) {
  const day = Number(value);
  return Number.isInteger(day) && day >= 5 && day <= 20 ? day : null;
}

const handler = async (request: Request, _context: Context) => {
  const store = getStore({ name: "xavier-daily-notes", consistency: "strong" });
  const url = new URL(request.url);

  try {
    if (request.method === "GET") {
      const day = validDay(url.searchParams.get("day"));
      if (!day) return response({ error: "Choose a valid journey day." }, 400);
      const note = (await store.get(`day/${day}`, { type: "json" })) as XavierNote | null;
      return response({ note });
    }

    if (request.method === "PUT") {
      if (!sameOrigin(request)) return response({ error: "Open this action from the journey app." }, 403);
      const body = (await request.json()) as Record<string, unknown>;
      const day = validDay(body.day);
      const text = clean(body.text, 4000);
      const password = clean(body.password, 200);
      if (!(await hasTDSession(request) || await canEditAnnouncements(password))) return response({ error: "Please sign in using TD Suitcase." }, 401);
      if (!day || !text) return response({ error: "Add a note before saving." }, 400);
      const note: XavierNote = { tripDate: day, text, updatedAt: new Date().toISOString() };
      const previous = await store.get(`day/${day}`, { type: "json" });
      await store.setJSON(`day/${day}`, note);
      await announce({ action: `${previous ? "Edited" : "Posted"} the Day ${day-4} announcement: ${text.slice(0, 110)}${text.length > 110 ? "…" : ""}`, section: "Home · Journey", day, url: `/?tab=journey&day=${day-4}` }, _context);
      return response({ note });
    }

    if (request.method === "DELETE") {
      if (!sameOrigin(request)) return response({ error: "Open this action from the journey app." }, 403);
      const body = (await request.json()) as Record<string, unknown>;
      const day = validDay(body.day);
      const password = clean(body.password, 200);
      if (!(await hasTDSession(request) || await canEditAnnouncements(password))) return response({ error: "Please sign in using TD Suitcase." }, 401);
      if (!day) return response({ error: "Choose a valid journey day." }, 400);
      const previous = await store.get(`day/${day}`, { type: "json" });
      await store.delete(`day/${day}`);
      if (previous) await announce({ action: `Removed the Day ${day-4} announcement`, section: "Home · Journey", day, url: `/?tab=journey&day=${day-4}` }, _context);
      return response({ ok: true });
    }

    return response({ error: "Method not allowed." }, 405);
  } catch (error) {
    console.error("Xavier daily notes error", error);
    return response({ error: "Xavier’s notes are temporarily unavailable. Please try again." }, 500);
  }
};

export default handler;

export const config: Config = {
  path: "/api/xavier-notes",
};
