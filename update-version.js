const fs = require("fs");
const path = require("path");

// Read the file
const filePath = path.join(__dirname, "dev", "form-tool", "form-tool-v2", "formtool-v2.ts");
const content = fs.readFileSync(filePath, "utf8");

// Find the version line and update it
const versionRegex = /console\.log\("Form Submit v(\d+)\.(\d+)\.(\d+)"\);/;
const match = content.match(versionRegex);

if (match) {
  const [_, major, minor, patch] = match;
  const newPatch = parseInt(patch) + 1;
  const newVersion = `console.log("Form Submit v${major}.${minor}.${newPatch}");`;

  const updatedContent = content.replace(versionRegex, newVersion);
  fs.writeFileSync(filePath, updatedContent);
  console.log(`Updated version to v${major}.${minor}.${newPatch}`);
} else {
  console.error("Could not find version line in file");
  process.exit(1);
}
