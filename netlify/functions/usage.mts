import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { getStore } from "@netlify/blobs";
import type { Config, Context } from "@netlify/functions";

type Visitor = {
  id: string;
  name: string;
  opens: number;
  firstOpenedAt: string;
  lastOpenedAt: string;
};

const headers = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers });
}

function clean(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function safeVisitorId(value: unknown) {
  const id = clean(value, 80);
  return /^[a-zA-Z0-9-]+$/.test(id) ? id : "";
}

function adminAuthorized(request: Request) {
  const expected = Netlify.env.get("USAGE_ADMIN_KEY") || "";
  const provided = clean(request.headers.get("x-usage-admin-key"), 200);
  if (!expected || !provided) return false;
  const expectedHash = createHash("sha256").update(expected).digest();
  const providedHash = createHash("sha256").update(provided).digest();
  return timingSafeEqual(expectedHash, providedHash);
}

async function statistics(store: ReturnType<typeof getStore>) {
  const { blobs } = await store.list({ prefix: "visitor/" });
  const visitors = (
    await Promise.all(
      blobs.map((blob) => store.get(blob.key, { type: "json" }) as Promise<Visitor | null>),
    )
  )
    .filter((visitor): visitor is Visitor => Boolean(visitor))
    .sort((a, b) => b.lastOpenedAt.localeCompare(a.lastOpenedAt));

  return {
    totalOpens: visitors.reduce((total, visitor) => total + visitor.opens, 0),
    uniqueVisitors: visitors.length,
    visitors: visitors.map(({ id, name, opens, lastOpenedAt }) => ({
      id,
      name: name || "Traveler",
      opens,
      lastOpenedAt,
    })),
  };
}

const handler = async (request: Request, _context: Context) => {
  const store = getStore({ name: "app-usage", consistency: "strong" });

  try {
    if (request.method === "GET") {
      if (!adminAuthorized(request)) return response({ error: "Not found." }, 404);
      return response(await statistics(store));
    }

    if (request.method === "DELETE") {
      if (!adminAuthorized(request)) return response({ error: "Not found." }, 404);
      const url = new URL(request.url);
      const visitorId = safeVisitorId(url.searchParams.get("visitorId"));
      if (!visitorId) return response({ error: "Visitor not found." }, 404);
      await store.delete(`visitor/${visitorId}`);
      return response({ ok: true });
    }

    if (request.method === "POST") {
      const body = (await request.json()) as Record<string, unknown>;
      const visitorId = safeVisitorId(body.visitorId) || randomUUID();
      const action = clean(body.action, 20);
      const name = clean(body.name, 80);
      const key = `visitor/${visitorId}`;
      const existing = (await store.get(key, { type: "json" })) as Visitor | null;
      const now = new Date().toISOString();
      const visitor: Visitor = {
        id: visitorId,
        name: name || existing?.name || "Traveler",
        opens: (existing?.opens || 0) + (action === "open" ? 1 : 0),
        firstOpenedAt: existing?.firstOpenedAt || now,
        lastOpenedAt: action === "open" ? now : existing?.lastOpenedAt || now,
      };
      await store.setJSON(key, visitor);
      return response({ ok: true, visitorId });
    }

    return response({ error: "Method not allowed." }, 405);
  } catch (error) {
    console.error("App usage error", error);
    return response({ error: "Usage statistics are temporarily unavailable." }, 500);
  }
};

export default handler;

export const config: Config = {
  path: "/api/usage",
};
