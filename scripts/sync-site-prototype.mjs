import { access, cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptsDirectory, "..");
const sourceDirectory = path.join(
  repositoryRoot,
  "apps",
  "site-prototype",
  "dist"
);
const publicDirectory = path.join(
  repositoryRoot,
  "apps",
  "web",
  "public",
  "site"
);

try {
  await access(sourceDirectory);
} catch {
  throw new Error(
    `Site prototype not found at ${sourceDirectory}. Merge apps/site-prototype before building the web app.`
  );
}

await rm(publicDirectory, { recursive: true, force: true });
await mkdir(path.dirname(publicDirectory), { recursive: true });
await cp(sourceDirectory, publicDirectory, { recursive: true });

console.log("Synced Geek Protocol Site into apps/web/public/site");
