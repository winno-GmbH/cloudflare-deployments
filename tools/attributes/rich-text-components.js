(function () {
  const templates = {};

  function loadTemplates() {
    document.querySelectorAll("[component-template]").forEach((el) => {
      const name = el.getAttribute("component-template");
      const properties = {};

      el.querySelectorAll("[component-field]").forEach((field) => {
        const fieldName = field.getAttribute("component-field");
        const defaultValue = field.getAttribute("component-default") || "";
        properties[fieldName] = {
          element: field,
          defaultValue: defaultValue || field.textContent.trim() || field.src || "",
        };
      });

      templates[name] = {
        element: el.cloneNode(true),
        properties: properties,
      };

      // Remove original template from DOM
      el.remove();
    });
  }

  function parseComponentString(str) {
    let content = str.slice(2, -2);

    // Normalize <br> around pipes into newlines for stable parsing
    content = content.replace(/(?:\s*<br\s*\/?>\s*)+\|/gi, "\n|");
    content = content.replace(/\|(?:\s*<br\s*\/?>\s*)+/gi, "|\n");

    content = content.trim();
    const parts = content.split("|").map((p) => p.trim()).filter(Boolean);

    const componentName = (parts[0] || "").trim();
    const attributes = {};

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      const colonIndex = part.indexOf(":");
      if (colonIndex > 0) {
        const key = part.substring(0, colonIndex).trim();
        const value = part.substring(colonIndex + 1).trim();
        attributes[key] = value;
      }
    }

    return { componentName, attributes };
  }

  function populateComponent(clone, attributes, propertyDefinitions) {
    // component-tag -> change element tag based on attribute
    clone.querySelectorAll("[component-tag]").forEach((field) => {
      const tagFieldName = field.getAttribute("component-tag");
      const newTag = attributes[tagFieldName];
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

    // component-url -> set href based on attribute (supports pasted <a href="...">)
    clone.querySelectorAll("[component-url]").forEach((field) => {
      const urlFieldName = field.getAttribute("component-url");
      const urlValue = attributes[urlFieldName];
      if (urlValue !== undefined) {
        const linkMatch = urlValue.match(/<a[^>]+href=["']([^"']+)["'][^>]*>.*?<\/a>/i);
        field.href = linkMatch ? linkMatch[1] : urlValue;
      }
      field.removeAttribute("component-url");
    });

    // component-attr-xxx="fieldName" -> set attribute xxx based on fieldName attribute value
    const allElements = clone.querySelectorAll("*");
    allElements.forEach((field) => {
      Array.from(field.attributes).forEach((attr) => {
        if (attr.name.startsWith("component-attr-")) {
          const attrName = attr.name.replace("component-attr-", "");
          const fieldName = attr.value;
          const value = attributes[fieldName];
          if (value !== undefined) field.setAttribute(attrName, value);
          field.removeAttribute(attr.name);
        }
      });
    });

    const nl2br = (s) => (s || "").replace(/\n/g, "<br>");

    // component-field -> fill fields
    clone.querySelectorAll("[component-field]").forEach((field) => {
      const fieldName = field.getAttribute("component-field");
      let value = attributes[fieldName];

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

    // component-show -> conditionally remove
    clone.querySelectorAll("[component-show]").forEach((field) => {
      const showFieldName = field.getAttribute("component-show");
      const showValue = attributes[showFieldName];
      if (showValue === "false" || showValue === "hide" || showValue === "0" || showValue === "no") {
        field.remove();
      }
      field.removeAttribute("component-show");
    });

    return clone;
  }

  // ---------- Comparisons extension helpers ----------

  function decodeHtmlLineBreaksToText(value) {
    if (!value) return "";
    // Convert <br> to newlines and strip remaining tags safely-ish
    return value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>\s*<p>/gi, "\n")
      .replace(/<\/?p[^>]*>/gi, "\n")
      .replace(/&nbsp;/gi, " ")
      .trim();
  }

  // Parses list like:
  // - title: Foo
  //   text: Bar
  // - title: Baz
  //   text: Qux
  function parseItemList(rawValue) {
    const text = decodeHtmlLineBreaksToText(rawValue);
    if (!text) return [];

    const lines = text.split("\n").map((l) => l.replace(/\r/g, ""));
    const items = [];
    let current = null;

    const pushCurrent = () => {
      if (!current) return;
      // only push if has something
      if ((current.title && current.title.trim()) || (current.text && current.text.trim())) {
        items.push({
          title: (current.title || "").trim(),
          text: (current.text || "").trim(),
        });
      }
      current = null;
    };

    for (const line of lines) {
      const t = line.trim();
      if (!t) continue;

      // new item
      if (t.startsWith("-")) {
        pushCurrent();
        current = { title: "", text: "" };

        // allow inline "- title: X"
        const rest = t.replace(/^-+\s*/, "");
        const idx = rest.indexOf(":");
        if (idx > 0) {
          const k = rest.slice(0, idx).trim();
          const v = rest.slice(idx + 1).trim();
          if (k === "title") current.title = v;
          else if (k === "text") current.text = v;
        }
        continue;
      }

      // key/value lines
      if (current && t.includes(":")) {
        const idx = t.indexOf(":");
        const k = t.slice(0, idx).trim();
        const v = t.slice(idx + 1).trim();
        if (k === "title") current.title = v;
        else if (k === "text") current.text = v;
        continue;
      }

      // fallback: if a line has no key, append to text
      if (current) {
        current.text = (current.text ? current.text + "\n" : "") + t;
      }
    }

    pushCurrent();
    return items;
  }

  function applyVariant(root, variantName) {
    // Optional: If you use component-variant="positive"/"negative" in the item template
    const variantEls = root.querySelectorAll("[component-variant]");
    if (!variantEls.length) return;
    variantEls.forEach((el) => {
      el.style.display = el.getAttribute("component-variant") === variantName ? "" : "none";
    });
  }

  function createComparisonsComponent(attributes) {
    const wrapperTemplate = templates["comparisons"];
    const itemTemplate = templates["comparison"] || templates["comparison-item"];

    if (!wrapperTemplate || !itemTemplate) return null;

    // Clone wrapper and populate normal fields (headings etc.)
    const wrapperClone = wrapperTemplate.element.cloneNode(true);
    wrapperClone.removeAttribute("component-template");
    populateComponent(wrapperClone, attributes, wrapperTemplate.properties);

    // Find slots
    const leftSlot = wrapperClone.querySelector('[component-slot="left-items"]');
    const rightSlot = wrapperClone.querySelector('[component-slot="right-items"]');

    // Parse lists from attributes
    const leftItems = parseItemList(attributes["left-items"] || "");
    const rightItems = parseItemList(attributes["right-items"] || "");

    // If slots are missing, still return wrapper (so you see something)
    if (!leftSlot && !rightSlot) return wrapperClone;

    // IMPORTANT:
    // Do not clear the slot with innerHTML="" if it contains static nodes (like wr_h).
    // Instead, append items into the slot. To avoid duplicates, remove only previously generated items.
    const clearGenerated = (slot) => {
      if (!slot) return;
      slot.querySelectorAll('[component-generated="true"]').forEach((n) => n.remove());
    };

    clearGenerated(leftSlot);
    clearGenerated(rightSlot);

    const makeItem = (data, variant) => {
      const itemClone = itemTemplate.element.cloneNode(true);
      itemClone.removeAttribute("component-template");

      // Populate item fields using existing populate logic:
      // It needs attributes keys matching component-field names, e.g. title/text
      populateComponent(
        itemClone,
        { title: data.title || "", text: data.text || "" },
        itemTemplate.properties
      );

      itemClone.setAttribute("component-generated", "true");
      applyVariant(itemClone, variant);
      return itemClone;
    };

    leftItems.forEach((it) => {
      if (leftSlot) leftSlot.appendChild(makeItem(it, "positive"));
    });

    rightItems.forEach((it) => {
      if (rightSlot) rightSlot.appendChild(makeItem(it, "negative"));
    });

    // Clean slot attributes on output (optional)
    wrapperClone.querySelectorAll("[component-slot]").forEach((el) => el.removeAttribute("component-slot"));

    return wrapperClone;
  }

  // ---------- Core creation ----------

  function createComponentFromString(componentStr) {
    const { componentName, attributes } = parseComponentString(componentStr);

    // Special component: comparisons (supports slots + repeatable items)
    if (componentName === "comparisons") {
      return createComparisonsComponent(attributes);
    }

    // Default components
    const template = templates[componentName];
    if (template) {
      const clone = template.element.cloneNode(true);
      clone.removeAttribute("component-template");
      return populateComponent(clone, attributes, template.properties);
    }

    return null;
  }

  function replaceComponentStrings() {
    const richTextElements = document.querySelectorAll(".w-richtext, .w-dyn-bind-empty, [class*='rich']");
    richTextElements.forEach((element) => {
      let html = element.innerHTML;
      const regex = /\{\{[\s\S]*?\}\}/g;

      html = html.replace(regex, (match) => {
        const component = createComponentFromString(match);
        if (component) {
          const temp = document.createElement("div");
          temp.appendChild(component);
          return temp.innerHTML;
        }
        return match;
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
