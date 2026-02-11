(function () {
  const templates = {};

  // ---------- Template loading ----------
  function loadTemplates() {
    document.querySelectorAll("[component-template]").forEach((el) => {
      const name = el.getAttribute("component-template");
      const properties = {};

      el.querySelectorAll("[component-field]").forEach((field) => {
        const fieldName = field.getAttribute("component-field");
        const defaultValue = field.getAttribute("component-default") || "";
        properties[fieldName] = {
          defaultValue: defaultValue || field.textContent.trim() || field.src || "",
        };
      });

      templates[name] = {
        element: el.cloneNode(true),
        properties,
      };

      el.remove();
    });
  }

  // ---------- Block extraction ----------
  function normalizeBlockContent(str) {
    let content = str.slice(2, -2);
    content = content.replace(/<br\s*\/?>/gi, "\n");
    content = content.replace(/<\/p>\s*<p>/gi, "\n");
    content = content.replace(/<\/?p[^>]*>/gi, "\n");
    content = content.replace(/<\/?div[^>]*>/gi, "\n");
    content = content.replace(/&nbsp;/gi, " ");
    return content.trim();
  }

  // ---------- Parsing to AST (generic, supports slots + nested components) ----------
  // AST node: { name, attrs: {}, slots: {slotName: [childNodes...] } }
  function parseComponentBlock(blockStr) {
    const content = normalizeBlockContent(blockStr);
    const lines = content.split("\n").map((l) => l.replace(/\r/g, ""));

    // Helpers
    const isPipe = (t) => t.startsWith("|");
    const hasColon = (t) => t.includes(":");
    const stripPipe = (t) => t.replace(/^\|\s*/, "");

    let i = 0;

    // Find first non-empty line => component name
    while (i < lines.length && !lines[i].trim()) i++;
    if (i >= lines.length) return null;

    const first = lines[i].trim();
    const rootName = stripPipe(first).trim();
    const root = { name: rootName, attrs: {}, slots: {} };
    i++;

    function parseKeyValue(line) {
      // expects "|key: value" or "|key:" (start slot)
      const rest = stripPipe(line.trim());
      const idx = rest.indexOf(":");
      if (idx < 0) return { key: rest.trim(), value: null };
      return { key: rest.slice(0, idx).trim(), value: rest.slice(idx + 1).trim() };
    }

    function parseChildComponent(startIndex) {
      // line at startIndex is "|ChildName"
      let j = startIndex;
      const childName = stripPipe(lines[j].trim()).trim();
      const child = { name: childName, attrs: {}, slots: {} };
      j++;

      for (; j < lines.length; j++) {
        const raw = lines[j];
        const t = raw.trim();
        if (!t) continue;

        // slot end OR parent slot change OR new child component => stop
        if (isPipe(t)) {
          // new child component line: "|something" without ":" AND not a slot end
          const rest = stripPipe(t);
          const isEndSlot = rest.startsWith("/");
          const isNewChild = !hasColon(rest) && !isEndSlot;

          // slot markers are handled in outer loop; stop when we hit either:
          // - next child component
          // - slot end marker
          // - a parent-level key line (has colon)
          if (isNewChild || isEndSlot || hasColon(rest)) break;

          // otherwise (rare) treat as plain line
        }

        // parse child attributes only (no nested slots inside child without explicit slot markers)
        // If you want child slots too, use the same slot syntax inside child by adding "|slot:" blocks,
        // which is supported by the outer loop when we render each child as its own block.
        // Here: we accept "|key: value" lines only.
        if (isPipe(t) && hasColon(stripPipe(t))) {
          const { key, value } = parseKeyValue(t);
          child.attrs[key] = value;
        } else {
          // ignore non pipe lines
        }
      }

      return { child, nextIndex: j };
    }

    for (; i < lines.length; ) {
      const raw = lines[i];
      const t = raw.trim();
      if (!t) {
        i++;
        continue;
      }

      if (!isPipe(t)) {
        i++;
        continue;
      }

      const rest = stripPipe(t);

      // Slot end marker like "|/left-items"
      if (rest.startsWith("/")) {
        // slot ends are consumed inside slot parsing; ignore at root level
        i++;
        continue;
      }

      // Slot start: "|left-items:" with empty value
      if (hasColon(rest)) {
        const { key, value } = parseKeyValue(t);

        // Slot block if value is empty and next lines contain nested components and ends with |/key
        if (value === "") {
          const slotName = key;
          root.slots[slotName] = [];

          i++; // move past "|slotName:"
          while (i < lines.length) {
            const line = lines[i].trim();
            if (!line) {
              i++;
              continue;
            }
            if (isPipe(line)) {
              const r = stripPipe(line);

              // end slot
              if (r === "/" + slotName) {
                i++; // consume end marker
                break;
              }

              // child component start: "|ChildName" (no ":")
              if (!hasColon(r)) {
                const { child, nextIndex } = parseChildComponent(i);
                root.slots[slotName].push(child);
                i = nextIndex;
                continue;
              }

              // If someone puts "|key: value" inside slot, ignore or treat as text.
              // We ignore to keep format strict.
            }
            i++;
          }
          continue;
        }

        // Normal attribute
        root.attrs[key] = value;
        i++;
        continue;
      }

      // If line is "|something" without ":" at root level => ignore (or could be malformed)
      i++;
    }

    return root;
  }

  // ---------- Rendering ----------
  function populateComponent(clone, attrs, propertyDefinitions) {
    // component-tag
    clone.querySelectorAll("[component-tag]").forEach((field) => {
      const tagFieldName = field.getAttribute("component-tag");
      const newTag = attrs[tagFieldName];
      if (newTag) {
        const newElement = document.createElement(newTag);
        Array.from(field.attributes).forEach((attr) => {
          if (attr.name !== "component-tag") newElement.setAttribute(attr.name, attr.value);
        });
        newElement.innerHTML = field.innerHTML;
        field.parentNode.replaceChild(newElement, field);
      } else {
        field.removeAttribute("component-tag");
      }
    });

    // component-url
    clone.querySelectorAll("[component-url]").forEach((field) => {
      const urlFieldName = field.getAttribute("component-url");
      const urlValue = attrs[urlFieldName];
      if (urlValue !== undefined) {
        const linkMatch = urlValue.match(/<a[^>]+href=["']([^"']+)["'][^>]*>.*?<\/a>/i);
        field.href = linkMatch ? linkMatch[1] : urlValue;
      }
      field.removeAttribute("component-url");
    });

    // component-attr-*
    clone.querySelectorAll("*").forEach((field) => {
      Array.from(field.attributes).forEach((attr) => {
        if (attr.name.startsWith("component-attr-")) {
          const attrName = attr.name.replace("component-attr-", "");
          const fieldName = attr.value;
          const value = attrs[fieldName];
          if (value !== undefined) field.setAttribute(attrName, value);
          field.removeAttribute(attr.name);
        }
      });
    });

    const nl2br = (s) => (s || "").replace(/\n/g, "<br>");

    // component-field
    clone.querySelectorAll("[component-field]").forEach((field) => {
      const fieldName = field.getAttribute("component-field");
      let value = attrs[fieldName];

      if (value === undefined && propertyDefinitions[fieldName]) {
        value = propertyDefinitions[fieldName].defaultValue;
      }

      if (value !== undefined) {
        if (field.tagName === "IMG") {
          field.src = value;
          if (!field.alt) field.alt = value;
        } else if (field.tagName === "A") {
          if (fieldName === "url" || fieldName === "link" || fieldName === "href") {
            const linkMatch = value.match(/<a[^>]+href=["']([^"']+)["'][^>]*>.*?<\/a>/i);
            field.href = linkMatch ? linkMatch[1] : value;
          } else {
            field.innerHTML = /<[^>]+>/.test(value) ? value.replace(/\n/g, "<br>") : nl2br(value);
          }
        } else {
          field.innerHTML = /<[^>]+>/.test(value) ? value.replace(/\n/g, "<br>") : nl2br(value);
        }
      }

      field.removeAttribute("component-field");
      field.removeAttribute("component-default");
    });

    // component-show
    clone.querySelectorAll("[component-show]").forEach((field) => {
      const showFieldName = field.getAttribute("component-show");
      const showValue = attrs[showFieldName];
      if (showValue === "false" || showValue === "hide" || showValue === "0" || showValue === "no") {
        field.remove();
      }
      field.removeAttribute("component-show");
    });

    return clone;
  }

  function renderNode(node) {
    const tpl = templates[node.name];
    if (!tpl) return null;

    const clone = tpl.element.cloneNode(true);
    clone.removeAttribute("component-template");

    // Fill normal fields first
    populateComponent(clone, node.attrs, tpl.properties);

    // Fill slots generically
    const slotEls = clone.querySelectorAll("[component-slot]");
    slotEls.forEach((slotEl) => {
      const slotName = slotEl.getAttribute("component-slot");
      const children = (node.slots && node.slots[slotName]) ? node.slots[slotName] : [];

      // Remove previously generated children if any (optional safety)
      slotEl.querySelectorAll('[component-generated="true"]').forEach((n) => n.remove());

      children.forEach((childNode) => {
        const rendered = renderNode(childNode);
        if (!rendered) return;
        rendered.setAttribute("component-generated", "true");
        slotEl.appendChild(rendered);
      });

      slotEl.removeAttribute("component-slot");
    });

    return clone;
  }

  // ---------- Replace {{...}} blocks in Rich Text ----------
  function replaceComponentStrings() {
    const richTextElements = document.querySelectorAll(".w-richtext, .w-dyn-bind-empty, [class*='rich']");
    const regex = /\{\{[\s\S]*?\}\}/g;

    richTextElements.forEach((element) => {
      let html = element.innerHTML;

      html = html.replace(regex, (match) => {
        const node = parseComponentBlock(match);
        if (!node) return match;

        const rendered = renderNode(node);
        if (!rendered) return match;

        const temp = document.createElement("div");
        temp.appendChild(rendered);
        return temp.innerHTML;
      });

      element.innerHTML = html;
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
