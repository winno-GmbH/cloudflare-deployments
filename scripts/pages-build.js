const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Build the TypeScript project first
console.log("Building TypeScript project...");
try {
  execSync("cd dev/form-tool/form-tool-v2 && npm run build", { stdio: "inherit" });
  console.log("TypeScript build completed successfully.");
} catch (error) {
  console.error("Failed to build TypeScript project:", error);
  process.exit(1);
}

// Ensure the .cloudflare directory exists
const cloudflareDir = path.join(__dirname, "../.cloudflare");
if (!fs.existsSync(cloudflareDir)) {
  fs.mkdirSync(cloudflareDir, { recursive: true });
}

// Create an _routes.json file for Cloudflare Pages
// This helps control which paths are handled by which scripts
console.log("Creating Cloudflare Pages routing configuration...");
const routesConfig = {
  version: 1,
  include: ["/*"],
  exclude: [],
};

fs.writeFileSync(path.join(__dirname, "../tools/_routes.json"), JSON.stringify(routesConfig, null, 2));
console.log("Build completed successfully!");
