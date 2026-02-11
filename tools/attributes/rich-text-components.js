(function () {
  /**
   * Rich Text Components
   * - Templates defined in DOM via [component-template]
   * - Fields inside templates via [component-field] (+ optional [component-default])
   * - Inline usage inside Rich Text via {{ ... }}
   *
   * This version fixes the most common cause of “component-field not replaced”:
   * Webflow line-wrapping / <br> / &nbsp; creating multi-line values that were not parsed.
   *
   * Logging philosophy:
   * - No noise. Only logs when something is wrong or suspicious.
   * - You’ll see warnings when fields fall back to defaults because the attribute was missing.
   */

  const templates = {};

  const LOG_PREFIX = "[RTC]";
  const LOG_LEVEL = {
    info: false, // keep off unless you really need it
    warn: true,
    error: true,
  };

  const logInfo = (...args) => LOG_LEVEL.info && console.log(LOG_PREFIX, ...args);
  const logWarn = (...args) => LOG_LEVEL.warn && console.warn(LOG_PREFIX, ...args);
  const logError = (...args) => LOG_LEVEL.error && console.error(LOG_PREFIX, ...args);

  function decodeHtmlEntities(str) {
    if (str == null) return "";
    const textarea = document.createElement("textarea");
    textarea.innerHTML = String(str);
    return textarea.value;
  }

  function normalizeBlockInnerHtml(str) {
    if (!str) return "";
    let s = String(str);

    // Convert Webflow <br> to newlines so multiline values can be parsed reliably
    s = s.replace(/<br\s*\/?>/gi, "\n");

    // Normalize non-breaking spaces
    s = s.replace(/&nbsp;/gi, " ");

    // Decode entities like &lt;br&gt; if they appear in logs/content
    s = decodeHtmlEntities(s);

    // Clean up weird whitespace
    s = s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    return s;
  }

  function loadTemplates() {
    const els = document.querySelectorAll("[component-template]");
    els.forEach((el) => {
      const name = (el.getAttribute("component-template") || "").trim();
      if (!name) return;

      const properties = {};
      el.querySelectorAll("[component-field]").forEach((field) => {
        const fieldName = (field.getAttribute("component-field") || "").trim();
        const defaultValueAttr = field.getAttribute("component-default");
        const defaultValue =
          (defaultValueAttr != null ? defaultValueAttr : "") ||
          field.textContent.trim() ||
          field.src ||
          "";
        if (fieldName) {
          properties[fieldName] = { element: field, defaultValue };
        }
      });

      templates[name] = {
        element: el.cloneNode(true),
        properties,
      };

      // Remove original template from DOM
      el.remove();
    });

    // Only log if something looks wrong
    if (Object.keys(templates).length === 0) {
      logError("No templates found. Did you add [component-template] elements to the page?");
    }
  }

  /**
   * Robust parser for blocks:
   * Supports multiline values:
   * |answer: first line
   * continues here without |
   * and here too
   *
   * Rules:
   * - Block is {{ ... }}
   * - Lines ideally start with |
   * - If a line does NOT start with | and we’re in a value, it is appended to last key value.
   */
  function parseComponentString(componentStr) {
    const rawInner = componentStr.slice(2, -2);
    const inner = normalizeBlockInnerHtml(rawInner).trim();

    // Split into lines. Keep empty lines (we’ll handle them).
    const lines = inner.split("\n");

    // Find first meaningful line as the component name
    let componentName = "";
    let i = 0;

    const cleanLine = (line) => String(line || "").trim();

    while (i < lines.length) {
      const l = cleanLine(lines[i]);
      if (l) {
        componentName = l.startsWith("|") ? l.slice(1).trim() : l;
        i++;
        break;
      }
      i++;
    }

    const attributes = {};
    let lastKey = null;

    for (; i < lines.length; i++) {
      const original = lines[i];
      const lineTrimmed = cleanLine(original);
      if (!lineTrimmed) continue;

      const isPipeLine = lineTrimmed.startsWith("|");
      const content = isPipeLine ? lineTrimmed.slice(1).trim() : lineTrimmed;

      // key: value
      const colonIndex = content.indexOf(":");

      if (colonIndex > 0) {
        const key = content.substring(0, colonIndex).trim();
        let value = content.substring(colonIndex + 1);

        // Important: Webflow often inserts leading spaces, keep but normalize
        value = value.replace(/^\s+/, "");
        value = value.replace(/\s+$/, "");

        attributes[key] = value;
        lastKey = key;
      } else {
        // Continuation line: only meaningful if we already have a key
        if (lastKey) {
          attributes[lastKey] = (attributes[lastKey] || "") + "\n" + content;
        } else {
          // No key to attach to -> ignore, but it’s a signal something is off
          logWarn("Found a continuation line without a key. Line:", content);
        }
      }
    }

    if (!componentName) {
      return { componentName: "", attributes: {} };
    }

    return { componentName, attributes };
  }

  function nl2br(s) {
    return (s || "").replace(/\n/g, "<br>");
  }

  function populateComponent(clone, attributes, propertyDefinitions, componentNameForLogs) {
    // 1) dynamic tag replacement
    clone.querySelectorAll("[component-tag]").forEach((field) => {
      const tagFieldName = (field.getAttribute("component-tag") || "").trim();
      const newTag = attributes[tagFieldName];
      if (newTag) {
        const newElement = document.createElement(String(newTag).trim());
        Array.from(field.attributes).forEach((attr) => {
          if (attr.name !== "component-tag") newElement.setAttribute(attr.name, attr.value);
        });
        newElement.innerHTML = field.innerHTML;
        field.parentNode.replaceChild(newElement, field);
      } else {
        field.removeAttribute("component-tag");
      }
    });

    // 2) url fields
    clone.querySelectorAll("[component-url]").forEach((field) => {
      const urlFieldName = (field.getAttribute("component-url") || "").trim();
      const urlValue = attributes[urlFieldName];
      if (urlValue !== undefined) {
        const linkMatch = String(urlValue).match(/<a[^>]+href=["']([^"']+)["'][^>]*>.*?<\/a>/i);
        field.href = linkMatch ? linkMatch[1] : String(urlValue).trim();
      }
      field.removeAttribute("component-url");
    });

    // 3) attribute mapping: component-attr-*
    clone.querySelectorAll("*").forEach((field) => {
      Array.from(field.attributes).forEach((attr) => {
        if (attr.name.startsWith("component-attr-")) {
          const attrName = attr.name.replace("component-attr-", "");
          const fieldName = String(attr.value || "").trim();
          const value = attributes[fieldName];
          if (value !== undefined) field.setAttribute(attrName, value);
          field.removeAttribute(attr.name);
        }
      });
    });

    // 4) main fields: component-field
    const missingFields = [];
    clone.querySelectorAll("[component-field]").forEach((field) => {
      const fieldName = (field.getAttribute("component-field") || "").trim();

      // Pull value from attributes; if not present, use template default
      let value = attributes[fieldName];
      const hasAttr = value !== undefined;

      if (!hasAttr && propertyDefinitions[fieldName]) {
        value = propertyDefinitions[fieldName].defaultValue;
      }

      // If still undefined -> nothing to set; record as missing
      if (value === undefined) {
        missingFields.push(fieldName);
      } else {
        // Normalize HTML entities and allow newlines
        const normalizedValue = normalizeBlockInnerHtml(String(value)).trim();

        if (field.tagName === "IMG") {
          field.src = normalizedValue;
          if (!field.alt) field.alt = normalizedValue;
        } else if (field.tagName === "A") {
          if (fieldName === "url" || fieldName === "link" || fieldName === "href") {
            const linkMatch = normalizedValue.match(/<a[^>]+href=["']([^"']+)["'][^>]*>.*?<\/a>/i);
            field.href = linkMatch ? linkMatch[1] : normalizedValue;
          } else {
            field.innerHTML = /<[^>]+>/.test(normalizedValue)
              ? normalizedValue.replace(/\n/g, "<br>")
              : nl2br(normalizedValue);
          }
        } else {
          field.innerHTML = /<[^>]+>/.test(normalizedValue)
            ? normalizedValue.replace(/\n/g, "<br>")
            : nl2br(normalizedValue);
        }
      }

      field.removeAttribute("component-field");
      field.removeAttribute("component-default");
    });

    // 5) conditional show/hide
    clone.querySelectorAll("[component-show]").forEach((field) => {
      const showFieldName = (field.getAttribute("component-show") || "").trim();
      const showValue = String(attributes[showFieldName] ?? "").trim().toLowerCase();
      if (showValue === "false" || showValue === "hide" || showValue === "0" || showValue === "no") {
        field.remove();
      } else {
        field.removeAttribute("component-show");
      }
    });

    // Meaningful logs only: when fields were missing OR everything fell back to defaults
    if (missingFields.length) {
      logWarn(
        `Component "${componentNameForLogs}" missing values for fields:`,
        missingFields,
        "Available keys:",
        Object.keys(attributes)
      );
    }

    return clone;
  }

  function createComponentFromString(componentStr) {
    const { componentName, attributes } = parseComponentString(componentStr);

    if (!componentName) {
      logWarn("Found a {{...}} block but could not parse a component name. Block:", componentStr);
      return null;
    }

    const template = templates[componentName];
    if (!template) {
      logWarn(`No template registered for component "${componentName}". Available:`, Object.keys(templates));
      return null;
    }

    const clone = template.element.cloneNode(true);
    clone.removeAttribute("component-template");
    clone.setAttribute("component-generated", "true");

    return populateComponent(clone, attributes, template.properties, componentName);
  }

  function replaceComponentStrings() {
    const richTextElements = document.querySelectorAll(".w-richtext, .w-dyn-bind-empty, [class*='rich']");
    if (!richTextElements.length) {
      logWarn("No rich text elements found for replacement.");
      return;
    }

    richTextElements.forEach((element) => {
      const html = element.innerHTML || "";
      const regex = /\{\{[\s\S]*?\}\}/g;
      let replacedAny = false;

      const newHtml = html.replace(regex, (match) => {
        const component = createComponentFromString(match);
        if (component) {
          replacedAny = true;
          const temp = document.createElement("div");
          temp.appendChild(component);
          return temp.innerHTML;
        }
        return match; // leave untouched if cannot render
      });

      if (replacedAny) {
        element.innerHTML = newHtml;
      }
    });
  }

  function init() {
    loadTemplates();
    replaceComponentStrings();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
