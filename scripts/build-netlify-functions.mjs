import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const projectRoot = resolve(import.meta.dirname, "..");
const source = resolve(projectRoot, "netlify/functions");
const destination = resolve(projectRoot, ".netlify/functions");
const library = await import(pathToFileURL("/root/.npm/_npx/90d26507e643fcc0/node_modules/@netlify/zip-it-and-ship-it/dist/main.js").href);

await rm(destination, { recursive: true, force: true });
const functions = await library.zipFunctions(source, destination, {
  archiveFormat: "zip",
  basePath: projectRoot,
  repositoryRoot: projectRoot,
  config: { "*": { nodeBundler: "esbuild" } },
});

console.log(JSON.stringify(functions.map(({ name, path, runtime, routes }) => ({ name, path, runtime, routes })), null, 2));
