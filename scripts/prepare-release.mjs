import { readFile, writeFile } from "node:fs/promises";

const version = process.env.VERSION?.trim();
if (!version || !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) {
  throw new Error(`Invalid VERSION: ${version ?? "<missing>"}`);
}

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const writeJson = async (path, value) => {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
};

const packageJson = await readJson("package.json");
const manifest = await readJson("manifest.json");
const versions = await readJson("versions.json");

packageJson.version = version;
manifest.version = version;
versions[version] = manifest.minAppVersion;

await Promise.all([
  writeJson("package.json", packageJson),
  writeJson("manifest.json", manifest),
  writeJson("versions.json", versions),
]);

const checks = [
  ["package.json version", packageJson.version === version],
  ["manifest.json version", manifest.version === version],
  ["versions.json entry", versions[version] === manifest.minAppVersion],
];
const failed = checks.filter(([, ok]) => !ok).map(([name]) => name);
if (failed.length > 0) {
  throw new Error(`Release version checks failed: ${failed.join(", ")}`);
}

console.log(`Release files prepared and verified for ${version}.`);
