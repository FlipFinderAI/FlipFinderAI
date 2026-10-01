import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const secretsPath = resolve(process.cwd(), ".ticket-frame-api-secrets");

if (!existsSync(secretsPath)) {
  console.error(
    "Missing .ticket-frame-api-secrets. Copy the fields from ticket-frame-api-secrets.example and enter the provider keys locally.",
  );
  process.exitCode = 1;
} else {
  const values = Object.fromEntries(
    readFileSync(secretsPath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separator = line.indexOf("=");
        return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
      }),
  );

  const required = ["FOOTBALL_DATA_ORG_KEY", "API_FOOTBALL_KEY"];
  const missing = required.filter((name) => !values[name]);

  if (missing.length) {
    console.error(`Missing required local key(s): ${missing.join(", ")}`);
    process.exitCode = 1;
  } else {
    console.log("Football API configuration is ready (2 required keys found). Values were not displayed.");
  }
}
