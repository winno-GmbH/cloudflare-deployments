const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configuration
const sourceDir = path.resolve(__dirname, "../tools");
const deployDir = path.resolve(__dirname, "../.deploy");

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

// Create a minimal wrangler.toml file
console.log("Creating wrangler.toml configuration...");
const wranglerConfig = `
name = "form-tool-worker"
main = "./tools/form-tool/formtool-v2.js"
compatibility_date = "2023-10-30"

# Add any additional configuration you need here
`;

fs.writeFileSync(path.join(deployDir, "wrangler.toml"), wranglerConfig);

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
