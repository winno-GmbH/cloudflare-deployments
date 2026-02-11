(function () {
  const templates = {};
  const RTC_DEBUG = true; // set false for production

  // ---------- Debug helpers ----------
  const D = {
    group(label, obj) {
      if (!RTC_DEBUG) return;
      console.groupCollapsed(`%c[RTC] ${label}`, "color:#0aa;");
      if (obj !== undefined) console.log(obj);
    },
    groupEnd() {
      if (!RTC_DEBUG) return;
      console.groupEnd();
    },
    log(...args) {
      if (!RTC_DEBUG) return;
      console.log("%c[RTC]", "color:#0aa;", ...args);
    },
    warn(...args) {
      if (!RTC_DEBUG) return;
      console.warn("%c[RTC WARN]", "color:#c90;", ...args);
    },
    error(...args) {
      if (!RTC_DEBUG) return;
      console.error("%c[RTC ERROR]", "color:#c00;", ...args);
    },
    elSummary(el) {
      if (!el) return null;
      const cls = (el.className && typeof el.className === "string") ? `.${el.className.trim().replace(/\s+/g, ".")}` : "";
      return `<${el.tagName.toLowerCase()}${cls}>`;
    },
  };

  // ---------- Template loading ----------
  function loadTemplates() {
    const found = document.querySelectorAll("[component-template]");
    D.group(`loadTemplates() found ${found.length} templates`);
    found.forEach((el) => {
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

      D.log("Template loaded:", name, { fields: Object.keys(properties), root: D.elSummary(el) });

      el.remove();
    });
    D.groupEnd();

    D.log("Templates available:", Object.keys(templates));
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

    const isPipe = (t) => t.startsWith("|");
    const hasColon = (t) => t.includes(":");
    const stripPipe = (t) => t.replace(/^\|\s*/, "");

    let i = 0;
    while (i < lines.length && !lines[i].trim()) i++;
    if (i >= lines.length) return null;

    const first = lines[i].trim();
    const rootName = stripPipe(first).trim();
    const root = { name: rootName, attrs: {}, slots: {} };
    i++;

    function parseKeyValue(line) {
      const rest = stripPipe(line.trim());
      const idx = rest.indexOf(":");
      if (idx < 0) return { key: rest.trim(), value: null };
      return { key: rest.slice(0, idx).trim(), value: rest.slice(idx + 1).trim() };
    }

    function parseChildComponent(startIndex) {
      let j = startIndex;
      const childName = stripPipe(lines[j].trim()).trim();
      const child = { name: childName, attrs: {}, slots: {} };
      j++;

      for (; j < lines.length; j++) {
        const raw = lines[j];
        const t = raw.trim();
        if (!t) continue;

        if (isPipe(t)) {
          const rest = stripPipe(t);
          const isEndSlot = rest.startsWith("/");
          const isNewChild = !hasColon(rest) && !isEndSlot;
          if (isNewChild || isEndSlot || hasColon(rest)) break;
        }

        if (isPipe(t) && hasColon(stripPipe(t))) {
          const { key, value } = parseKeyValue(t);
          child.attrs[key] = value;
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

      if (rest.startsWith("/")) {
        i++;
        continue;
      }

      if (hasColon(rest)) {
        const { key, value } = parseKeyValue(t);

        // Slot block if value is empty (|slot:) then children until |/slot
        if (value === "") {
          const slotName = key;
          root.slots[slotName] = [];

          i++; // past "|slot:"
          while (i < lines.length) {
            const line = lines[i].trim();
            if (!line) {
              i++;
              continue;
            }
            if (isPipe(line)) {
              const r = stripPipe(line);

              if (r === "/" + slotName) {
                i++; // consume end
                break;
              }

              if (!hasColon(r)) {
                const { child, nextIndex } = parseChildComponent(i);
                root.slots[slotName].push(child);
                i = nextIndex;
                continue;
              }
            }
            i++;
          }
          continue;
        }

        root.attrs[key] = value;
        i++;
        continue;
      }

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

  function renderNode(node, depth = 0) {
    const pad = "  ".repeat(depth);
    const tpl = templates[node.name];

    if (!tpl) {
      D.error(`${pad}Missing template for component: "${node.name}"`, {
        availableTemplates: Object.keys(templates),
      });
      return null;
    }

    D.group(`${pad}Render "${node.name}"`, { attrs: node.attrs, slots: Object.keys(node.slots || {}) });

    const clone = tpl.element.cloneNode(true);
    clone.removeAttribute("component-template");

    // Fill fields
    populateComponent(clone, node.attrs, tpl.properties);

    // Fill slots
    const slotEls = clone.querySelectorAll("[component-slot]");
    const slotElsCount = slotEls.length;

    if (slotElsCount === 0 && node.slots && Object.keys(node.slots).length) {
      D.warn(`${pad}Node has slot content, but template has NO [component-slot] elements`, {
        component: node.name,
        slotsProvided: Object.keys(node.slots),
      });
    }

    slotEls.forEach((slotEl) => {
      const slotName = slotEl.getAttribute("component-slot");
      const children = (node.slots && node.slots[slotName]) ? node.slots[slotName] : [];

      D.log(`${pad}Slot "${slotName}" in template:`, D.elSummary(slotEl), "children:", children.length);

      if (!node.slots || !node.slots[slotName]) {
        D.warn(`${pad}Template slot "${slotName}" has NO matching slot content in Rich Text`, {
          component: node.name,
          slotName,
          slotsProvided: Object.keys(node.slots || {}),
        });
      }

      // remove previously generated children (safety)
      slotEl.querySelectorAll('[component-generated="true"]').forEach((n) => n.remove());

      children.forEach((childNode, idx) => {
        const rendered = renderNode(childNode, depth + 1);
        if (!rendered) {
          D.warn(`${pad}Child render failed`, { slot: slotName, index: idx, child: childNode.name });
          return;
        }
        rendered.setAttribute("component-generated", "true");
        slotEl.appendChild(rendered);
      });

      slotEl.removeAttribute("component-slot");
    });

    D.groupEnd();
    return clone;
  }

  // ---------- Replace {{...}} blocks ----------
  function replaceComponentStrings() {
  const richTextElements = document.querySelectorAll(".w-richtext, .w-dyn-bind-empty, [class*='rich']");
  const regex = /\{\{[\s\S]*?\}\}/g;

  console.group("[RTC] replaceComponentStrings()");
  console.log("RichText elements found:", richTextElements.length);

  richTextElements.forEach((element, index) => {

    const before = element.innerHTML;
    const hasBlock = regex.test(before);
    regex.lastIndex = 0;

    if (!hasBlock) return;

    console.group(`[RTC] Processing RichText[${index}]`);
    console.log("Element:", element);
    console.log("Before HTML length:", before.length);

    // Check if recaptcha exists BEFORE
    const recaptchaBefore = element.querySelector('.g-recaptcha, [data-sitekey]');
    if (recaptchaBefore) {
      console.warn("[RTC] reCAPTCHA placeholder FOUND before replace:", recaptchaBefore);
    }

    let html = before.replace(regex, (match) => {
      console.group("[RTC] Found block");
      console.log(match);

      const node = parseComponentBlock(match);
      console.log("Parsed AST:", node);

      const rendered = renderNode(node, 0);
      console.log("Rendered node:", rendered);

      console.groupEnd();

      if (!rendered) return match;

      const temp = document.createElement("div");
      temp.appendChild(rendered);
      return temp.innerHTML;
    });

    console.log("After HTML length:", html.length);

    element.innerHTML = html;

    // Check if recaptcha exists AFTER
    const recaptchaAfter = element.querySelector('.g-recaptcha, [data-sitekey]');
    if (!recaptchaAfter && recaptchaBefore) {
      console.error("[RTC] reCAPTCHA placeholder was REMOVED by innerHTML rewrite");
    }

    console.groupEnd();
  });

  console.groupEnd();
}


  // ---------- Init ----------
  function init() {
    D.log("Init start");
    loadTemplates();
    replaceComponentStrings();
    D.log("Init done");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
