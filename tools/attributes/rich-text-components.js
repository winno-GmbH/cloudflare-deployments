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

  function htmlToTextLines(html) {
    if (!html) return "";
    let s = String(html);

    s = s.replace(/<\/p>\s*<p[^>]*>/gi, "\n");
    s = s.replace(/<p[^>]*>/gi, "");
    s = s.replace(/<\/p>/gi, "\n");
    s = s.replace(/<br\s*\/?>/gi, "\n");
    s = s.replace(/<[^>]+>/g, "");
    s = s.replace(/&nbsp;/gi, " ");

    const t = document.createElement("textarea");
    t.innerHTML = s;
    s = t.value;

    return s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
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

  function extractBlocks(text) {
    const blocks = [];
    const re = /\{\{([\s\S]*?)\}\}/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      blocks.push({ raw: m[0], inner: (m[1] || "").trim() });
    }
    return blocks;
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

  // UPDATED: supports IMG + ALT + default lazy loading
  function fillFields(node, attrs) {
    node.querySelectorAll("[component-field]").forEach((el) => {
      const key = (el.getAttribute("component-field") || "").trim();
      if (!key) return;
      if (!(key in attrs)) return;

      const val = attrs[key];

      if (el.tagName === "IMG") {
        // value for the image field is the URL
        el.src = val;

        // alt handling:
        // - if you provide "|image-alt: ..." it will be used
        // - else keep existing alt, or set to empty to be valid
        const altKey = `${key}-alt`;
        if (altKey in attrs) el.alt = attrs[altKey];
        else if (!el.hasAttribute("alt")) el.alt = "";

        // always lazy-load (as requested)
        el.loading = "lazy";

        // safe default to avoid layout shift if you use width/height in template
        // (no-op if not present)
        return;
      }

      // For non-img fields
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

  function replaceInRichTextElements() {
    document.querySelectorAll(".w-richtext").forEach((el) => {
      const textish = htmlToTextLines(el.innerHTML);
      const blocks = extractBlocks(textish);
      if (!blocks.length) return;

      const parts = [];
      let lastIndex = 0;
      const re = /\{\{([\s\S]*?)\}\}/g;
      let m;

      while ((m = re.exec(textish)) !== null) {
        const before = textish.slice(lastIndex, m.index);
        if (before.trim()) {
          const p = document.createElement("p");
          p.textContent = before.trim();
          parts.push(p);
        }

        const ast = parseComponentDoc((m[1] || "").trim());
        parts.push(ast ? renderComponent(ast) : document.createTextNode(m[0]));
        lastIndex = re.lastIndex;
      }

      const after = textish.slice(lastIndex);
      if (after.trim()) {
        const p = document.createElement("p");
        p.textContent = after.trim();
        parts.push(p);
      }

      el.innerHTML = "";
      parts.forEach((n) => el.appendChild(n));
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
