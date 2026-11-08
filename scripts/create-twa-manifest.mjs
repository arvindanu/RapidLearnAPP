import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rawUrl = process.env.RAPIDLEARN_URL;
if (!rawUrl) {
  throw new Error("Missing GitHub Actions variable RAPIDLEARN_URL. Set it to the public HTTPS Vercel domain, without a trailing slash.");
}

const host = new URL(rawUrl).origin;
if (!host.startsWith("https://")) {
  throw new Error("RAPIDLEARN_URL must be an HTTPS URL.");
}

const packageId = process.env.ANDROID_PACKAGE_ID || "com.rapidlearn.app";
if (!/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(packageId)) {
  throw new Error(`Invalid ANDROID_PACKAGE_ID: ${packageId}`);
}

const versionCode = Number(process.env.GITHUB_RUN_NUMBER || 1);
if (!Number.isSafeInteger(versionCode) || versionCode < 1) {
  throw new Error("GITHUB_RUN_NUMBER must be a positive integer.");
}

const templatePath = path.join(root, "android", "twa-manifest.template.json");
const outputPath = path.join(root, "android", "twa-manifest.json");
const keystorePath = path.join(root, "rapidlearn-release.keystore");
const manifest = JSON.parse(fs.readFileSync(templatePath, "utf8"));
manifest.host = host;
manifest.iconUrl = `${host}/icons/rapidlearn-512.png`;
manifest.maskableIconUrl = `${host}/icons/rapidlearn-maskable-512.png`;
manifest.webManifestUrl = `${host}/manifest.webmanifest`;
manifest.packageId = packageId;
manifest.appVersionCode = versionCode;
manifest.appVersionName = `1.0.${versionCode}`;
manifest.appVersion = manifest.appVersionName;
manifest.signingKey.path = keystorePath;

fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated TWA manifest for ${host} (${packageId}, version ${manifest.appVersionName}).`);
