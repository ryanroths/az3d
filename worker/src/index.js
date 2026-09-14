// AZ3D upload worker — POST /api/upload (multipart, field "file") → R2
// GET /api/file/<key>?t=<DOWNLOAD_TOKEN> → download (owner only)
// Secrets: DOWNLOAD_TOKEN  (wrangler secret put DOWNLOAD_TOKEN)

const ALLOWED_ORIGINS = ["https://az3d.net", "https://www.az3d.net", "http://localhost:8080", "http://127.0.0.1:8080"];

function cors(req) {
  const o = req.headers.get("Origin") || "";
  const ok = ALLOWED_ORIGINS.includes(o);
  return {
    "Access-Control-Allow-Origin": ok ? o : "https://az3d.net",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}
const json = (req, body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...cors(req) } });

function safeName(name) {
  return (name || "file").replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80) || "file";
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });

    if (url.pathname === "/api/upload" && req.method === "POST") {
      const max = parseInt(env.MAX_BYTES || "52428800", 10);
      const len = parseInt(req.headers.get("Content-Length") || "0", 10);
      if (len > max + 4096) return json(req, { error: `File too large (max ${Math.round(max / 1048576)} MB)` }, 413);

      let form;
      try { form = await req.formData(); } catch { return json(req, { error: "Bad form data" }, 400); }
      const file = form.get("file");
      if (!(file instanceof File)) return json(req, { error: "No file" }, 400);
      if (file.size > max) return json(req, { error: `File too large (max ${Math.round(max / 1048576)} MB)` }, 413);

      const allowed = (env.ALLOWED_EXT || "stl,3mf").split(",");
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      if (!allowed.includes(ext)) return json(req, { error: `Allowed types: ${allowed.join(", ")}` }, 415);

      const d = new Date();
      const key = `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID().slice(0, 8)}-${safeName(file.name)}`;
      await env.UPLOADS.put(key, file.stream(), {
        httpMetadata: { contentType: file.type || "application/octet-stream" },
        customMetadata: { originalName: file.name, size: String(file.size), ip: req.headers.get("CF-Connecting-IP") || "" },
      });
      const download = `${url.origin}/api/file/${key}?t=${env.DOWNLOAD_TOKEN || ""}`;
      return json(req, { ok: true, key, name: file.name, size: file.size, download });
    }

    if (url.pathname.startsWith("/api/file/") && req.method === "GET") {
      if (!env.DOWNLOAD_TOKEN || url.searchParams.get("t") !== env.DOWNLOAD_TOKEN) return new Response("Forbidden", { status: 403 });
      const key = decodeURIComponent(url.pathname.slice("/api/file/".length));
      const obj = await env.UPLOADS.get(key);
      if (!obj) return new Response("Not found", { status: 404 });
      const name = obj.customMetadata?.originalName || key.split("/").pop();
      return new Response(obj.body, {
        headers: {
          "Content-Type": obj.httpMetadata?.contentType || "application/octet-stream",
          "Content-Disposition": `attachment; filename="${name.replace(/"/g, "")}"`,
          "Content-Length": String(obj.size),
        },
      });
    }

    return json(req, { error: "Not found" }, 404);
  },
};
