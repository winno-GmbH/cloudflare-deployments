(function () {
  const templates = {};

  function injectBaseStyles() {
    if (document.getElementById("rtc-component-style")) return;

    const style = document.createElement("style");
    style.id = "rtc-component-style";
    style.textContent = `
      .rtc-component {
        all: revert;
        display: block;
        margin: 1.5em 0;
      }
      .rtc-component .rtc-component {
        margin: 0;
      }
    `;
    document.head.appendChild(style);
  }

  function loadTemplates() {
    document.querySelectorAll("[component-template]").forEach((el) => {
      const name = (el.getAttribute("component-template") || "").trim();
      if (!name) return;

      const fields = Array.from(el.querySelectorAll("[component-field]"))
        .map((f) => (f.getAttribute("component-field") || "").trim())
        .filter(Boolean);

      templates[name] = { el, fields };
    });
  }

  function parseComponentDoc(innerText) {
    const lines = innerText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const norm = (l) => (l.startsWith("|") ? l.slice(1).trim() : l);

    const first = norm(lines[0] || "");
    if (!first) return null;

    const root = { name: first, attrs: {}, slots: {} };

    let i = 1;
    while (i < lines.length) {
      const line = norm(lines[i]);

      const slotStart = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*$/);
      if (slotStart) {
        const slotName = slotStart[1];
        const children = [];
        i++;

        while (i < lines.length) {
          const l2 = norm(lines[i]);
          if (l2 === `/${slotName}`) break;

          if (!l2.includes(":") && !l2.startsWith("/")) {
            const child = { name: l2, attrs: {}, slots: {} };
            i++;

            while (i < lines.length) {
              const look = norm(lines[i]);
              if (look === `/${slotName}`) break;
              if (!look.includes(":") && !look.startsWith("/")) break;

              const kv = look.match(/^([a-zA-Z0-9_-]+)\s*:\s*([\s\S]*)$/);
              if (kv) child.attrs[kv[1]] = kv[2].trim();
              i++;
            }

            children.push(child);
            continue;
          }

          i++;
        }

        root.slots[slotName] = children;

        while (i < lines.length && norm(lines[i]) !== `/${slotName}`) i++;
        i++;
        continue;
      }

      const kv = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*([\s\S]*)$/);
      if (kv) root.attrs[kv[1]] = kv[2].trim();

      i++;
    }

    return root;
  }

  function fillFields(node, attrs) {
    node.querySelectorAll("[component-field]").forEach((el) => {
      const key = (el.getAttribute("component-field") || "").trim();
      if (!key) return;
      if (!(key in attrs)) return;

      const val = attrs[key];

      if (el.tagName === "IMG") {
        el.src = val;
        const altKey = `${key}-alt`;
        if (altKey in attrs) el.alt = attrs[altKey];
        else if (!el.hasAttribute("alt")) el.alt = "";
        el.loading = "lazy";
        return;
      }

      el.innerHTML = val;
    });
  }

  function clearSlot(slotEl) {
    slotEl.querySelectorAll('[component-generated="true"]').forEach((n) => n.remove());
  }

  function renderComponent(ast) {
    const tpl = templates[ast.name];
    if (!tpl) return document.createTextNode("");

    const clone = tpl.el.cloneNode(true);
    clone.removeAttribute("component-template");
    clone.setAttribute("component-generated", "true");
    clone.classList.add("rtc-component");

    fillFields(clone, ast.attrs);

    Object.entries(ast.slots || {}).forEach(([slotName, children]) => {
      const slotEl = clone.querySelector(`[component-slot="${slotName}"]`);
      if (!slotEl) return;

      clearSlot(slotEl);
      children.forEach((childAst) => slotEl.appendChild(renderComponent(childAst)));
    });

    return clone;
  }

  // NEW: Extract text from a single paragraph element
  function getParagraphText(el) {
    return el.textContent.trim();
  }

  // NEW: Check if element contains component syntax
  function containsComponentSyntax(text) {
    return text.includes("{{") && text.includes("}}");
  }

  // NEW: Process component blocks while preserving HTML
  function replaceInRichTextElements() {
    document.querySelectorAll(".w-richtext").forEach((richTextEl) => {
      const children = Array.from(richTextEl.children);
      
      // Track if we're inside a component block
      let inComponentBlock = false;
      let componentLines = [];
      let componentStartIndex = -1;
      
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const text = getParagraphText(child);
        
        // Check if this paragraph starts a component
        if (!inComponentBlock && text === "{{") {
          inComponentBlock = true;
          componentLines = [];
          componentStartIndex = i;
          continue;
        }
        
        // Check if this paragraph ends a component
        if (inComponentBlock && text === "}}") {
          inComponentBlock = false;
          
          // Parse and render the component
          const componentText = componentLines.join("\n");
          const ast = parseComponentDoc(componentText);
          
          if (ast) {
            const componentNode = renderComponent(ast);
            
            // Replace all the component paragraphs with the rendered component
            // Insert the component before the first paragraph
            children[componentStartIndex].parentNode.insertBefore(
              componentNode, 
              children[componentStartIndex]
            );
            
            // Remove all the component paragraphs ({{ ... }})
            for (let j = componentStartIndex; j <= i; j++) {
              children[j].remove();
            }
          }
          
          componentLines = [];
          componentStartIndex = -1;
          continue;
        }
        
        // If we're inside a component block, collect the line
        if (inComponentBlock) {
          componentLines.push(text);
        }
      }
    });
  }

  function init() {
    injectBaseStyles();
    loadTemplates();
    replaceInRichTextElements();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();