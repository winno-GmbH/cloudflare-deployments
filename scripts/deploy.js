const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configuration
const sourceDir = path.resolve(__dirname, "../tools");
const deployDir = path.resolve(__dirname, "../.deploy");
const wranglerConfigPath = path.resolve(__dirname, "../wrangler.toml");

// Create a clean deployment directory
console.log("Preparing deployment directory...");
if (fs.existsSync(deployDir)) {
  // Remove existing directory
  fs.rmSync(deployDir, { recursive: true, force: true });
}
fs.mkdirSync(deployDir, { recursive: true });

// Copy only the tools directory
console.log("Copying tools directory...");
fs.cpSync(sourceDir, path.join(deployDir, "tools"), { recursive: true });

// Copy wrangler.toml if it exists
if (fs.existsSync(wranglerConfigPath)) {
  console.log("Copying wrangler.toml...");
  fs.copyFileSync(wranglerConfigPath, path.join(deployDir, "wrangler.toml"));
}

// Deploy using wrangler
console.log("Deploying to Cloudflare Workers...");
try {
  // Change to the deploy directory
  process.chdir(deployDir);

  // Run wrangler deploy command
  execSync("npx wrangler deploy", { stdio: "inherit" });

  console.log("Deployment completed successfully!");
} catch (error) {
  console.error("Deployment failed:", error);
  process.exit(1);
}
