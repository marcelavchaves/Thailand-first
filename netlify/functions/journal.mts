import { createHash, randomUUID } from "node:crypto";
import { getStore } from "@netlify/blobs";
import type { Config, Context } from "@netlify/functions";

type StoredEntry = {
  id: string;
  tripDate: number;
  author: string;
  note: string;
  restaurantName: string;
  restaurantUrl: string;
  photoUrl: string;
  createdAt: string;
  updatedAt: string;
  ownerHash: string;
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

function tokenFrom(request: Request) {
  return clean(request.headers.get("x-journal-token"), 160);
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function validUrl(value: string) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function publicEntry(entry: StoredEntry, ownerHash: string) {
  return {
    id: entry.id,
    tripDate: entry.tripDate,
    author: entry.author,
    note: entry.note,
    restaurantName: entry.restaurantName,
    restaurantUrl: entry.restaurantUrl,
    photoUrl: entry.photoUrl,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    isOwner: Boolean(ownerHash && ownerHash === entry.ownerHash),
  };
}

async function listEntries(store: ReturnType<typeof getStore>, day: number, ownerHash: string) {
  const { blobs } = await store.list({ prefix: `day/${day}/` });
  const entries = await Promise.all(
    blobs.map((blob) => store.get(blob.key, { type: "json" }) as Promise<StoredEntry | null>),
  );
  return entries
    .filter((entry): entry is StoredEntry => Boolean(entry))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((entry) => publicEntry(entry, ownerHash));
}

const handler = async (request: Request, _context: Context) => {
  const store = getStore({ name: "traveler-memories", consistency: "strong" });
  const url = new URL(request.url);
  const token = tokenFrom(request);
  const ownerHash = token ? tokenHash(token) : "";

  try {
    if (request.method === "GET") {
      const day = validDay(url.searchParams.get("day"));
      if (!day) return response({ error: "Choose a valid journey day." }, 400);
      return response({ entries: await listEntries(store, day, ownerHash) });
    }

    if (!token || token.length < 32) {
      return response({ error: "This device could not create a secure traveler key. Please refresh and try again." }, 400);
    }

    if (request.method === "POST") {
      const body = (await request.json()) as Record<string, unknown>;
      const tripDate = validDay(body.tripDate);
      const author = clean(body.author, 80);
      const note = clean(body.note, 2400);
      const restaurantName = clean(body.restaurantName, 120);
      const restaurantUrl = validUrl(clean(body.restaurantUrl, 600));
      const photoUrl = validUrl(clean(body.photoUrl, 600));
      if (!tripDate || !author || (!note && !restaurantName && !photoUrl)) {
        return response({ error: "Add your name and at least one memory, comment, restaurant, or photo link." }, 400);
      }
      const id = randomUUID();
      const now = new Date().toISOString();
      const entry: StoredEntry = {
        id,
        tripDate,
        author,
        note,
        restaurantName,
        restaurantUrl,
        photoUrl,
        createdAt: now,
        updatedAt: now,
        ownerHash,
      };
      await store.setJSON(`day/${tripDate}/${id}`, entry);
      return response({ entry: publicEntry(entry, ownerHash) }, 201);
    }

    if (request.method === "PATCH") {
      const body = (await request.json()) as Record<string, unknown>;
      const tripDate = validDay(body.tripDate);
      const id = clean(body.id, 80);
      if (!tripDate || !id) return response({ error: "Memory not found." }, 404);
      const key = `day/${tripDate}/${id}`;
      const existing = (await store.get(key, { type: "json" })) as StoredEntry | null;
      if (!existing) return response({ error: "Memory not found." }, 404);
      if (existing.ownerHash !== ownerHash) return response({ error: "Only the traveler who posted this memory can edit it." }, 403);
      const author = clean(body.author, 80);
      const note = clean(body.note, 2400);
      const restaurantName = clean(body.restaurantName, 120);
      const restaurantUrl = validUrl(clean(body.restaurantUrl, 600));
      const photoUrl = validUrl(clean(body.photoUrl, 600));
      if (!author || (!note && !restaurantName && !photoUrl)) {
        return response({ error: "Add your name and at least one memory, comment, restaurant, or photo link." }, 400);
      }
      const entry: StoredEntry = {
        ...existing,
        author,
        note,
        restaurantName,
        restaurantUrl,
        photoUrl,
        updatedAt: new Date().toISOString(),
      };
      await store.setJSON(key, entry);
      return response({ entry: publicEntry(entry, ownerHash) });
    }

    if (request.method === "DELETE") {
      const tripDate = validDay(url.searchParams.get("day"));
      const id = clean(url.searchParams.get("id"), 80);
      if (!tripDate || !id) return response({ error: "Memory not found." }, 404);
      const key = `day/${tripDate}/${id}`;
      const existing = (await store.get(key, { type: "json" })) as StoredEntry | null;
      if (!existing) return response({ error: "Memory not found." }, 404);
      if (existing.ownerHash !== ownerHash) return response({ error: "Only the traveler who posted this memory can delete it." }, 403);
      await store.delete(key);
      const files=getStore({name:"memory-attachments",consistency:"strong"});
      await Promise.all([1,2,3].map(slot=>files.delete(`${tripDate}/${id}/${slot}`)));
      return response({ ok: true });
    }

    return response({ error: "Method not allowed." }, 405);
  } catch (error) {
    console.error("Traveler journal error", error);
    return response({ error: "The shared journal is temporarily unavailable. Your draft remains on this device." }, 500);
  }
};

export default handler;

export const config: Config = {
  path: "/api/journal",
};
