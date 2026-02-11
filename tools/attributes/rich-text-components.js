(function () {
  const LOG_PREFIX = "[RTC]";
  const templates = {};

  const warn = (...a) => console.warn(LOG_PREFIX, ...a);
  const error = (...a) => console.error(LOG_PREFIX, ...a);

  // --- Sanitization: make Webflow RichText HTML behave like plain text lines
  function htmlToTextLines(html) {
    if (!html) return "";

    let s = String(html);

    // Normalize common Webflow paragraph boundaries into line breaks
    s = s.replace(/<\/p>\s*<p[^>]*>/gi, "\n");
    s = s.replace(/<p[^>]*>/gi, "");
    s = s.replace(/<\/p>/gi, "\n");

    // Convert <br> to newline
    s = s.replace(/<br\s*\/?>/gi, "\n");

    // Strip any other tags that might leak into the block
    s = s.replace(/<[^>]+>/g, "");

    // Entities
    s = s.replace(/&nbsp;/gi, " ");

    // Decode remaining entities safely
    const t = document.createElement("textarea");
    t.innerHTML = s;
    s = t.value;

    // Normalize newlines
    s = s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    return s;
  }

  function loadTemplates() {
    const els = document.querySelectorAll("[component-template]");
    els.forEach((el) => {
      const name = (el.getAttribute("component-template") || "").trim();
      if (!name) return;

      const fields = Array.from(el.querySelectorAll("[component-field]"))
        .map((f) => (f.getAttribute("component-field") || "").trim())
        .filter(Boolean);

      templates[name] = {
        el,
        fields,
      };
    });
  }

  // --- Block extraction: find {{ ... }} in already-sanitized text
  function extractBlocks(text) {
    const blocks = [];
    const re = /\{\{([\s\S]*?)\}\}/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      blocks.push({
        raw: m[0],
        inner: (m[1] || "").trim(),
      });
    }
    return blocks;
  }

  // --- Parse a component “document”:
  // Lines starting with | define either:
  // - |key: value    (attribute)
  // - |componentName (start of a nested component)
  // Slot format:
  // |items:
  // |child-component
  // |field: value
  // |child-component
  // |field: value
  // |/items
  function parseComponentDoc(innerText) {
    const lines = innerText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length);

    // Remove leading pipes if user wrote them; treat both "rich-faq" and "|rich-faq"
    const norm = (l) => (l.startsWith("|") ? l.slice(1).trim() : l);

    // First meaningful line is the component name
    const first = norm(lines[0] || "");
    if (!first) return null;

    const root = { name: first, attrs: {}, slots: {} };

    let i = 1;
    while (i < lines.length) {
      let line = norm(lines[i]);

      // Slot start: "items:"
      const slotStart = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*$/);
      if (slotStart) {
        const slotName = slotStart[1];
        const children = [];
        i++;

        // Read until "/items"
        while (i < lines.length) {
          const l2raw = norm(lines[i]);
          if (l2raw === `/${slotName}`) break;

          // Child component start: line with no ":" and not closing tag
          if (!l2raw.includes(":") && !l2raw.startsWith("/")) {
            const childName = l2raw;
            const child = { name: childName, attrs: {}, slots: {} };
            i++;

            // Consume attributes until next child or slot end
            while (i < lines.length) {
              const look = norm(lines[i]);
              if (look === `/${slotName}`) break;
              if (!look.includes(":") && !look.startsWith("/")) break;

              const kv = look.match(/^([a-zA-Z0-9_-]+)\s*:\s*([\s\S]*)$/);
              if (kv) {
                child.attrs[kv[1]] = kv[2].trim();
              }
              i++;
            }

            children.push(child);
            continue;
          }

          // If it's "key: value" inside slot (optional), treat as slot-level attr (rare)
          // We ignore by default to avoid confusion.
          i++;
        }

        root.slots[slotName] = children;
        // consume closing "/items"
        while (i < lines.length && norm(lines[i]) !== `/${slotName}`) i++;
        i++; // skip close
        continue;
      }

      // Root attribute: "key: value"
      const kv = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*([\s\S]*)$/);
      if (kv) {
        root.attrs[kv[1]] = kv[2].trim();
      } else {
        // Only log if it's clearly problematic
        warn("Unparsed line at root:", line);
      }
      i++;
    }

    return root;
  }

  function fillFields(node, attrs) {
    const fields = node.querySelectorAll("[component-field]");
    fields.forEach((el) => {
      const key = (el.getAttribute("component-field") || "").trim();
      if (!key) return;
      if (!(key in attrs)) return;

      // Set text or rich content
      el.innerHTML = attrs[key];
    });
  }

  function renderComponent(ast) {
    const tpl = templates[ast.name];
    if (!tpl) {
      error(`No template registered for component "${ast.name}". Available:`, Object.keys(templates));
      return document.createTextNode(""); // fail silently in DOM
    }

    const clone = tpl.el.cloneNode(true);
    clone.removeAttribute("component-template");
    clone.setAttribute("component-generated", "true");

    // Fill root fields
    fillFields(clone, ast.attrs);

    // Fill slots
    Object.entries(ast.slots || {}).forEach(([slotName, children]) => {
      const slotEl = clone.querySelector(`[component-slot="${slotName}"]`);
      if (!slotEl) {
        warn(`Missing slot "${slotName}" on template "${ast.name}"`);
        return;
      }

      slotEl.innerHTML = "";
      children.forEach((childAst) => {
        const childNode = renderComponent(childAst);
        slotEl.appendChild(childNode);
      });
    });

    // Debug: if template has fields but none matched attrs, warn once
    const expected = tpl.fields || [];
    if (expected.length) {
      const matched = expected.filter((k) => k in ast.attrs).length;
      if (matched === 0 && Object.keys(ast.attrs).length) {
        warn(`Fields not matched for "${ast.name}". Expected fields:`, expected, "Got keys:", Object.keys(ast.attrs));
      }
    }

    return clone;
  }

  function replaceInRichTextElements() {
    const richEls = document.querySelectorAll(".w-richtext");
    richEls.forEach((el) => {
      // Work on HTML, sanitize to lines, but replace using DOM range
      const originalHTML = el.innerHTML;
      const textish = htmlToTextLines(originalHTML);
      const blocks = extractBlocks(textish);

      if (!blocks.length) return;

      // For replacement, we re-scan el.innerHTML and replace the FIRST occurrence of each raw {{...}} by rendering
      // Robust approach: rebuild by splitting on {{...}} in the sanitized text, then inject nodes.
      // We will just replace el.innerHTML fully using sanitized blocks positions (stable enough for your use-case).
      const parts = [];
      let lastIndex = 0;

      const re = /\{\{([\s\S]*?)\}\}/g;
      let m;
      while ((m = re.exec(textish)) !== null) {
        const before = textish.slice(lastIndex, m.index);
        if (before.trim().length) {
          const p = document.createElement("p");
          p.textContent = before.trim();
          parts.push(p);
        }

        const inner = (m[1] || "").trim();
        const ast = parseComponentDoc(inner);
        if (!ast) {
          warn("Could not parse block:", inner);
          const p = document.createElement("p");
          p.textContent = m[0];
          parts.push(p);
        } else {
          parts.push(renderComponent(ast));
        }

        lastIndex = re.lastIndex;
      }

      const after = textish.slice(lastIndex);
      if (after.trim().length) {
        const p = document.createElement("p");
        p.textContent = after.trim();
        parts.push(p);
      }

      // Replace content
      el.innerHTML = "";
      parts.forEach((n) => el.appendChild(n));
    });
  }

  function init() {
    loadTemplates();
    replaceInRichTextElements();
  }

  // Run after Webflow is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
