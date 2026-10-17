import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const outputRoot = join(projectRoot, "out");
const functionRoot = join(projectRoot, ".netlify/functions");
const siteId = "080f3016-bbf0-41f7-ae9d-d1f6c9f63b47";
const apiRoot = "https://api.netlify.com/api/v1";
const netlifyConfig = JSON.parse(readFileSync("/root/.config/netlify/config.json", "utf8"));
const token = netlifyConfig.users?.[netlifyConfig.userId]?.auth?.token;
if (!token) throw new Error("Netlify authorization token is unavailable.");

async function request(path, options = {}) {
  const response = await fetch(`${apiRoot}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${await response.text()}`);
  return response.status === 204 ? null : response.json();
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const current = await request(`/sites/${siteId}/files`);
const files = Object.fromEntries(current.map(({ path, sha }) => [path, sha]));
const uploads = new Map();
for (const localPath of walk(outputRoot)) {
  const bytes = readFileSync(localPath);
  const sha = createHash("sha1").update(bytes).digest("hex");
  const sitePath = `/${relative(outputRoot, localPath).split("\\").join("/")}`;
  files[sitePath] = sha;
  uploads.set(sha, { sitePath, bytes });
}

const functions = {};
const functionUploads = new Map();
for (const name of ["journal", "comments", "xavier-notes", "usage"]) {
  const bytes = readFileSync(join(functionRoot, `${name}.zip`));
  const sha = createHash("sha256").update(bytes).digest("hex");
  functions[name] = sha;
  functionUploads.set(sha, { name, bytes });
}

const deploy = await request(`/sites/${siteId}/deploys`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    files,
    functions,
    framework: "next",
    draft: false,
    async: false,
    title: "Repair PDF and upgrade traveler memories",
  }),
});

for (const sha of deploy.required ?? []) {
  const upload = uploads.get(sha);
  if (!upload) continue;
  const path = upload.sitePath.replace(/^\//, "").split("/").map(encodeURIComponent).join("/");
  await request(`/deploys/${deploy.id}/files/${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/octet-stream" },
    body: upload.bytes,
  });
}

for (const sha of deploy.required_functions ?? []) {
  const upload = functionUploads.get(sha);
  if (!upload) continue;
  await request(`/deploys/${deploy.id}/functions/${encodeURIComponent(upload.name)}?runtime=js&invocation_mode=stream`, {
    method: "PUT",
    headers: { "Content-Type": "application/zip" },
    body: upload.bytes,
  });
}

let finalDeploy = deploy;
for (let index = 0; index < 60 && !["ready", "error"].includes(finalDeploy.state); index += 1) {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  finalDeploy = await request(`/deploys/${deploy.id}`);
}

console.log(JSON.stringify({
  id: finalDeploy.id,
  state: finalDeploy.state,
  url: finalDeploy.ssl_url,
  deployUrl: finalDeploy.deploy_ssl_url,
  required: finalDeploy.required,
  requiredFunctions: finalDeploy.required_functions,
  functions: finalDeploy.available_functions?.map(({ n, ro }) => ({ name: n, routes: ro })),
  error: finalDeploy.error_message,
}, null, 2));

if (finalDeploy.state !== "ready") process.exitCode = 1;
