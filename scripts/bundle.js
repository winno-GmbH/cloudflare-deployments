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

// Function to extract variable definitions and usages from a file
function extractDependencies(content) {
  const definitions = new Set();
  const usages = new Set();

  // Find variable, class, and function declarations
  const declarationRegex = /(?:const|let|var|class|function)\s+([a-zA-Z_$][\w$]*)/g;
  let match;
  while ((match = declarationRegex.exec(content)) !== null) {
    definitions.add(match[1]);
  }

  // Find variable usages (this is a simplified approach)
  const codeWithoutStrings = content.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/g, "");
  const words = codeWithoutStrings.match(/[a-zA-Z_$][\w$]*/g) || [];

  for (const word of words) {
    if (
      !definitions.has(word) &&
      ![
        "if",
        "else",
        "for",
        "while",
        "return",
        "new",
        "this",
        "function",
        "const",
        "let",
        "var",
        "class",
        "extends",
        "true",
        "false",
        "null",
        "undefined",
        "typeof",
        "instanceof",
        "try",
        "catch",
        "throw",
        "switch",
        "case",
        "default",
        "break",
        "continue",
      ].includes(word)
    ) {
      usages.add(word);
    }
  }

  return { definitions, usages };
}

async function bundleFiles() {
  try {
    // Ensure source directory exists
    if (!fs.existsSync(sourceDir)) {
      console.error(`Source directory doesn't exist: ${sourceDir}`);
      process.exit(1);
    }

    // Read all JS files
    const files = fs.readdirSync(sourceDir).filter((file) => file.endsWith(".js"));

    // Special case: ensure entry file comes first
    const entryFileIndex = files.findIndex((file) => file === "formtool-test-v2.js" || file === "index.js");
    if (entryFileIndex !== -1) {
      const entryFile = files.splice(entryFileIndex, 1)[0];
      files.unshift(entryFile);
    }

    // Read file contents and extract dependencies
    const fileInfos = [];
    for (const file of files) {
      const filePath = path.join(sourceDir, file);
      let content = fs.readFileSync(filePath, "utf8");

      // Process the content to remove imports and exports
      const cleanedContent = cleanModuleCode(content);
      const { definitions, usages } = extractDependencies(cleanedContent);

      fileInfos.push({
        file,
        content: cleanedContent,
        definitions: [...definitions],
        usages: [...usages],
        included: false,
      });
    }

    // Sort files based on dependencies
    const orderedFiles = [];

    // Helper function to check if all dependencies of a file are included
    function areDependenciesSatisfied(fileInfo) {
      return fileInfo.usages.every((usage) => {
        // Check if any already included file defines this variable
        return orderedFiles.some((includedFile) =>
          fileInfos.find((f) => f.file === includedFile).definitions.includes(usage)
        );
      });
    }

    // First, include files that don't have any special dependencies
    fileInfos
      .filter((info) => info.usages.length === 0)
      .forEach((info) => {
        if (!info.included) {
          orderedFiles.push(info.file);
          info.included = true;
        }
      });

    // Then, iteratively include files as their dependencies are satisfied
    let madeProgress = true;
    while (madeProgress) {
      madeProgress = false;

      for (const info of fileInfos) {
        if (!info.included && areDependenciesSatisfied(info)) {
          orderedFiles.push(info.file);
          info.included = true;
          madeProgress = true;
        }
      }
    }

    // Include any remaining files (circular dependencies case)
    fileInfos
      .filter((info) => !info.included)
      .forEach((info) => {
        console.warn(`Warning: Circular dependency or unresolved dependency in ${info.file}`);
        orderedFiles.push(info.file);
      });

    // Create bundle header
    let bundleContent = `/**
 * Form Tool v2
 * Compiled on ${new Date().toISOString()}
 * Dependencies resolved automatically
 */
(function() {
// Define a global object to store exports
window.FormToolV2 = window.FormToolV2 || {};

// Declare all variables at the top to handle forward references
${fileInfos
  .flatMap((info) => info.definitions)
  .filter((value, index, self) => self.indexOf(value) === index) // unique values
  .map((varName) => `var ${varName};`)
  .join("\n")}

`;

    // Add files in dependency order
    for (const file of orderedFiles) {
      const fileInfo = fileInfos.find((info) => info.file === file);
      bundleContent += `\n// Source: ${file}\n${fileInfo.content}\n`;
    }

    bundleContent += `
// Export main FormTool object to global scope if it exists
if (typeof FormTool !== 'undefined') {
  window.FormTool = FormTool;
}

})();`;

    // Ensure target directory exists
    ensureDirSync(path.dirname(targetFile));

    // Write the bundle file
    fs.writeFileSync(targetFile, bundleContent);
    console.log(`Successfully bundled to: ${targetFile}`);
    console.log(`Files bundled in this order: ${orderedFiles.join(", ")}`);

    // Clean up dist directory (optional)
    // removeSync(sourceDir);
    // console.log("Cleaned up temporary files.");
  } catch (error) {
    console.error("Error bundling files:", error);
    process.exit(1);
  }
}

bundleFiles();
