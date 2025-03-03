const fs = require("fs");
const path = require("path");

// Paths
const sourceDir = path.resolve(__dirname, "../dev/form-tool/form-tool-v2/dist");
const targetFile = path.resolve(__dirname, "../tools/form-tool/formtool-test-v2.js");

// Helper function to ensure directory exists
function ensureDirSync(dirPath) {
  if (!fs.existsSync(dirPath)) {
    // Create parent directories recursively
    ensureDirSync(path.dirname(dirPath));
    fs.mkdirSync(dirPath);
  }
}

// Helper function to remove directory recursively
function removeSync(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // Recursive case: it's a directory
        removeSync(curPath);
      } else {
        // Base case: it's a file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dirPath);
  }
}

// Helper function to remove imports and exports from file content
function cleanModuleCode(content) {
  // Remove ES Module imports
  content = content.replace(/import\s+(?:(?:\{[^}]*\})|(?:[\w*]+))(?:\s+as\s+[\w*]+)?\s+from\s+['"][^'"]+['"];?/g, "");
  content = content.replace(/import\s+['"][^'"]+['"];?/g, "");
  content = content.replace(/import\s*\(\s*['"][^'"]+['"](?:,\s*\{[^}]*\})?\s*\)\s*;?/g, "");

  // Remove require statements
  content = content.replace(
    /(?:const|let|var)\s+(?:\{[^}]*\}|\w+)\s*=\s*require\s*\(\s*['"][^'"]+['"](?:,\s*\{[^}]*\})?\s*\)\s*;?/g,
    ""
  );
  content = content.replace(/const\s+\w+\s*=\s*require\s*\([^)]+\)\s*;?/g, "");

  // Remove ES Module exports
  content = content.replace(/export\s+default\s+/g, "");
  content = content.replace(/export\s+const\s+/g, "const ");
  content = content.replace(/export\s+let\s+/g, "let ");
  content = content.replace(/export\s+var\s+/g, "var ");
  content = content.replace(/export\s+function\s+/g, "function ");
  content = content.replace(/export\s+class\s+/g, "class ");
  content = content.replace(/export\s+\{[^}]*\};?/g, "");
  content = content.replace(/export\s+\*\s+from\s+['"][^'"]+['"];?/g, "");

  // Remove CommonJS exports
  content = content.replace(/module\.exports\s*=\s*/g, "");
  content = content.replace(/exports\.\w+\s*=\s*/g, "");

  return content;
}

async function bundleFiles() {
  try {
    // Ensure source directory exists
    if (!fs.existsSync(sourceDir)) {
      console.error(`Source directory doesn't exist: ${sourceDir}`);
      process.exit(1);
    }

    // Get all JS files from the dist directory
    const files = fs
      .readdirSync(sourceDir)
      .filter((file) => file.endsWith(".js"))
      .sort((a, b) => {
        // Ensure formtool-v2.js comes first in the bundle
        if (a === "formtool-test-v2.js") return -1;
        if (b === "formtool-test-v2.js") return 1;
        return a.localeCompare(b);
      });

    // Create bundle content
    let bundleContent = `/**
 * Form Tool v2
 * Compiled on ${new Date().toISOString()}
 */
(function() {
// Define a global object to store exported values
window.FormToolV2 = window.FormToolV2 || {};

`;

    // Read and concatenate all files
    for (const file of files) {
      const filePath = path.join(sourceDir, file);
      let content = fs.readFileSync(filePath, "utf8");

      // Process the content to remove imports and exports
      content = cleanModuleCode(content);

      bundleContent += `\n// Source: ${file}\n${content}\n`;
    }

    bundleContent += `
})();`;

    // Ensure target directory exists
    ensureDirSync(path.dirname(targetFile));

    // Write the bundle file
    fs.writeFileSync(targetFile, bundleContent);
    console.log(`Successfully bundled to: ${targetFile}`);

    // Clean up dist directory (optional)
    removeSync(sourceDir);
    console.log("Cleaned up temporary files.");
  } catch (error) {
    console.error("Error bundling files:", error);
    process.exit(1);
  }
}

bundleFiles();
