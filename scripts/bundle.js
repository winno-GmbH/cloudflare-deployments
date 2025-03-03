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

// Helper function to clean module code by removing imports/exports
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
    const allDefinitions = new Set();
    const duplicateDefinitions = new Set();

    // First pass: gather all definitions to identify duplicates
    for (const file of files) {
      const filePath = path.join(sourceDir, file);
      let content = fs.readFileSync(filePath, "utf8");
      content = cleanModuleCode(content);

      const { definitions } = extractDependencies(content);

      // Track duplicates
      for (const def of definitions) {
        if (allDefinitions.has(def)) {
          duplicateDefinitions.add(def);
        } else {
          allDefinitions.add(def);
        }
      }
    }

    console.log(
      `Found ${duplicateDefinitions.size} duplicate definitions:`,
      duplicateDefinitions.size > 0 ? [...duplicateDefinitions].join(", ") : "none"
    );

    // Second pass: process files and transform code
    for (const file of files) {
      const filePath = path.join(sourceDir, file);
      let content = fs.readFileSync(filePath, "utf8");

      // Clean module code
      content = cleanModuleCode(content);

      // Extract dependency info
      const { definitions, usages } = extractDependencies(content);

      // Process local declarations that conflict with others
      for (const def of definitions) {
        if (duplicateDefinitions.has(def)) {
          // Rename local variable declarations that conflict globally
          const varDefRegex = new RegExp(`((?:const|let|var|function)\\s+)(${def})(\\s*=|\\s*\\(|\\s*\\{)`, "g");
          // Generate a unique name for this file's version of the variable
          const fileBaseName = path.basename(file, ".js").replace(/[^a-zA-Z0-9]/g, "_");
          const newName = `_${def}_${fileBaseName}`;
          content = content.replace(varDefRegex, `$1${newName}$3`);

          // Also rename all usages within this file
          const usageRegex = new RegExp(`\\b${def}\\b(?!\\s*=|\\()`, "g");
          content = content.replace(usageRegex, newName);
        }
      }

      fileInfos.push({
        file,
        content,
        definitions: [...definitions],
        usages: [...usages],
        included: false,
      });
    }

    // Sort files based on dependencies
    const orderedFiles = [];

    // Helper function to check if all dependencies of a file are included
    function areDependenciesSatisfied(fileInfo) {
      const satisfiedDependencies = fileInfo.usages.filter((usage) => {
        // Check if any already included file defines this variable
        const isSatisfied = orderedFiles.some((includedFile) =>
          fileInfos.find((f) => f.file === includedFile).definitions.includes(usage)
        );

        // Also satisfied if it's a duplicate that will be handled specially
        return isSatisfied || duplicateDefinitions.has(usage);
      });

      // File is satisfied if all dependencies are satisfied or if there are no dependencies
      return satisfiedDependencies.length === fileInfo.usages.length;
    }

    // First, include files that don't have any special dependencies
    fileInfos
      .filter((info) => info.usages.length === 0 || areDependenciesSatisfied(info))
      .forEach((info) => {
        if (!info.included) {
          orderedFiles.push(info.file);
          info.included = true;
        }
      });

    // Then, iteratively include files as their dependencies are satisfied
    let madeProgress = true;
    let iterations = 0;
    const maxIterations = files.length * 2; // Safety limit

    while (madeProgress && iterations < maxIterations) {
      madeProgress = false;
      iterations++;

      for (const info of fileInfos) {
        if (!info.included && areDependenciesSatisfied(info)) {
          orderedFiles.push(info.file);
          info.included = true;
          madeProgress = true;
        }
      }
    }

    // Include any remaining files (circular dependencies case)
    const remainingFiles = fileInfos.filter((info) => !info.included);
    if (remainingFiles.length > 0) {
      console.warn(`Warning: Circular dependencies detected in ${remainingFiles.length} files`);
      remainingFiles.forEach((info) => {
        console.warn(`  - ${info.file}`);
        orderedFiles.push(info.file);
      });
    }

    // Create bundle header
    let bundleContent = `/**
 * Form Tool v2
 * Compiled on ${new Date().toISOString()}
 * Dependencies resolved automatically
 */
(function(window) {
  // Shared namespace for resolving references
  var _internal = {};

`;

    // Add files in dependency order
    for (const file of orderedFiles) {
      const fileInfo = fileInfos.find((info) => info.file === file);
      bundleContent += `\n// Source: ${file}\n${fileInfo.content}\n`;
    }

    bundleContent += `
  
})(window);`;

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
