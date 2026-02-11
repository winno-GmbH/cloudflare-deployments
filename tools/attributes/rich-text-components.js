(function () {
  const templates = {};

  function injectBaseStyles() {
    if (document.getElementById("rtc-component-style")) return;

    const style = document.createElement("style");
    style.id = "rtc-component-style";
    style.innerHTML = `
      .rtc-component {
        all: revert;
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

      templates[name] = { el, fields };
    });
  }

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

  function parseComponentDoc(innerText) {
    const lines = innerText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length);

    const norm = (l) => (l.startsWith("|") ? l.slice(1).trim() : l);

    const first = norm(lines[0] || "");
    if (!first) return null;

    const root = { name: first, attrs: {}, slots: {} };

    let i = 1;
    while (i < lines.length) {
      let line = norm(lines[i]);

      const slotStart = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*$/);
      if (slotStart) {
        const slotName = slotStart[1];
        const children = [];
        i++;

        while (i < lines.length) {
          const l2raw = norm(lines[i]);
          if (l2raw === `/${slotName}`) break;

          if (!l2raw.includes(":") && !l2raw.startsWith("/")) {
            const childName = l2raw;
            const child = { name: childName, attrs: {}, slots: {} };
            i++;

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

          i++;
        }

        root.slots[slotName] = children;
        while (i < lines.length && norm(lines[i]) !== `/${slotName}`) i++;
        i++;
        continue;
      }

      const kv = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*([\s\S]*)$/);
      if (kv) {
        root.attrs[kv[1]] = kv[2].trim();
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
      el.innerHTML = attrs[key];
    });
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

      slotEl.innerHTML = "";
      children.forEach((childAst) => {
        const childNode = renderComponent(childAst);
        slotEl.appendChild(childNode);
      });
    });

    return clone;
  }

  function replaceInRichTextElements() {
    const richEls = document.querySelectorAll(".w-richtext");

    richEls.forEach((el) => {
      const originalHTML = el.innerHTML;
      const textish = htmlToTextLines(originalHTML);
      const blocks = extractBlocks(textish);

      if (!blocks.length) return;

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
