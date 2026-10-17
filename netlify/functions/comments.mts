import { randomUUID } from "node:crypto";
import { getStore } from "@netlify/blobs";
import type { Config, Context } from "@netlify/functions";

type StoredComment = {
  id: string;
  entryId: string;
  author: string;
  comment: string;
  createdAt: string;
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

const handler = async (request: Request, _context: Context) => {
  const store = getStore({ name: "traveler-memories", consistency: "strong" });
  const url = new URL(request.url);

  try {
    if (request.method === "GET") {
      const entryId = clean(url.searchParams.get("entryId"), 80);
      if (!entryId) return response({ error: "Memory not found." }, 400);
      const { blobs } = await store.list({ prefix: `comments/${entryId}/` });
      const comments = await Promise.all(
        blobs.map((blob) => store.get(blob.key, { type: "json" }) as Promise<StoredComment | null>),
      );
      return response({
        comments: comments
          .filter((item): item is StoredComment => Boolean(item))
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      });
    }

    if (request.method === "POST") {
      const body = (await request.json()) as Record<string, unknown>;
      const entryId = clean(body.entryId, 80);
      const author = clean(body.author, 80);
      const comment = clean(body.comment, 1000);
      if (!entryId || !author || !comment) {
        return response({ error: "Add your name and a comment." }, 400);
      }
      const item: StoredComment = {
        id: randomUUID(),
        entryId,
        author,
        comment,
        createdAt: new Date().toISOString(),
      };
      await store.setJSON(`comments/${entryId}/${item.id}`, item);
      return response({ comment: item }, 201);
    }

    return response({ error: "Method not allowed." }, 405);
  } catch (error) {
    console.error("Traveler comment error", error);
    return response({ error: "Comments are temporarily unavailable. Please try again." }, 500);
  }
};

export default handler;

export const config: Config = {
  path: "/api/comments",
};
