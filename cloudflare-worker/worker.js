const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };

function allowedOrigin(request, env) {
  const origin = request.headers.get("Origin") || "";
  const configured = (env.ALLOWED_ORIGIN || "").split(",").map(value => value.trim()).filter(Boolean);
  if (configured.includes("*")) return "*";
  return configured.includes(origin) ? origin : "";
}

function corsHeaders(request, env) {
  const origin = allowedOrigin(request, env);
  return {
    ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Upload-Token, Range",
    "Access-Control-Expose-Headers": "Content-Length, Content-Range, ETag, Accept-Ranges",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function authorized(request, env) {
  const provided = request.headers.get("X-Upload-Token") || "";
  return Boolean(env.UPLOAD_TOKEN) && provided === env.UPLOAD_TOKEN;
}

function json(request, env, value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...JSON_HEADERS, ...corsHeaders(request, env) }
  });
}

function safeFilename(value) {
  const cleaned = (value || "media.bin").normalize("NFKC").replace(/[^a-zA-Z0-9._-]+/g, "_");
  return cleaned.slice(-140) || "media.bin";
}

function mediaUrl(request, key) {
  const url = new URL(request.url);
  const encoded = key.split("/").map(encodeURIComponent).join("/");
  return `${url.origin}/media/${encoded}`;
}

async function serveMedia(request, env, key) {
  const rangeHeader = request.headers.get("Range");
  const object = await env.MEDIA_BUCKET.get(key, rangeHeader ? { range: request.headers } : undefined);
  if (!object) return new Response("Not found", { status: 404, headers: corsHeaders(request, env) });

  const headers = new Headers(corsHeaders(request, env));
  object.writeHttpMetadata(headers);
  headers.set("ETag", object.httpEtag);
  headers.set("Accept-Ranges", "bytes");

  if (rangeHeader && object.range && "offset" in object.range && "length" in object.range) {
    const start = object.range.offset;
    const end = start + object.range.length - 1;
    headers.set("Content-Range", `bytes ${start}-${end}/${object.size}`);
    headers.set("Content-Length", String(object.range.length));
    return new Response(object.body, { status: 206, headers });
  }

  headers.set("Content-Length", String(object.size));
  return new Response(object.body, { status: 200, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);

    if (request.method === "OPTIONS") {
      if (!allowedOrigin(request, env)) return new Response("Origin not allowed", { status: 403 });
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname === "/health" && request.method === "GET") {
      if (!authorized(request, env)) return json(request, env, { ok: false, error: "Unauthorized" }, 401);
      return json(request, env, { ok: true, r2: Boolean(env.MEDIA_BUCKET) });
    }

    if (url.pathname === "/upload" && request.method === "PUT") {
      if (!allowedOrigin(request, env)) return json(request, env, { error: "Origin not allowed" }, 403);
      if (!authorized(request, env)) return json(request, env, { error: "Unauthorized" }, 401);
      if (!request.body) return json(request, env, { error: "Missing upload body" }, 400);

      const contentLength = Number(request.headers.get("Content-Length") || 0);
      const maxBytes = Number(env.MAX_UPLOAD_BYTES || 95 * 1024 * 1024);
      if (contentLength > maxBytes) return json(request, env, { error: "File is too large" }, 413);

      const filename = safeFilename(url.searchParams.get("filename"));
      const key = `uploads/${Date.now()}-${crypto.randomUUID()}-${filename}`;
      const contentType = request.headers.get("Content-Type") || "application/octet-stream";

      await env.MEDIA_BUCKET.put(key, request.body, {
        httpMetadata: { contentType, cacheControl: "public, max-age=3600" },
        customMetadata: { uploadedAt: new Date().toISOString() }
      });

      return json(request, env, { ok: true, key, url: mediaUrl(request, key) }, 201);
    }

    if (url.pathname.startsWith("/media/")) {
      const key = url.pathname.slice("/media/".length).split("/").map(decodeURIComponent).join("/");
      if (!key) return new Response("Not found", { status: 404, headers: cors });

      if (request.method === "GET" || request.method === "HEAD") {
        const response = await serveMedia(request, env, key);
        return request.method === "HEAD" ? new Response(null, { status: response.status, headers: response.headers }) : response;
      }

      if (request.method === "DELETE") {
        if (!allowedOrigin(request, env)) return json(request, env, { error: "Origin not allowed" }, 403);
        if (!authorized(request, env)) return json(request, env, { error: "Unauthorized" }, 401);
        await env.MEDIA_BUCKET.delete(key);
        return json(request, env, { ok: true });
      }
    }

    return json(request, env, { name: "EmoStream R2 Upload Worker", status: "ready" });
  }
};
