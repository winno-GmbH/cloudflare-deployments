(function () {
  console.log("Rich Component Script V10 - Fixed component-visibility & component-url");
  
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
    console.log("✅ Base styles injected");
  }

  function loadTemplates() {
    document.querySelectorAll("[component-template]").forEach((el) => {
      const name = (el.getAttribute("component-template") || "").trim();
      if (!name) return;

      const fields = Array.from(el.querySelectorAll("[component-field]"))
        .map((f) => (f.getAttribute("component-field") || "").trim())
        .filter(Boolean);

      templates[name] = { el, fields };
      console.log(`✅ Loaded template: ${name}`, fields);
    });
    console.log("📋 Total templates loaded:", Object.keys(templates));
  }

  function parseComponentDoc(innerText) {
    console.log("🔍 Parsing component doc:", innerText.substring(0, 100) + "...");
    
    const lines = innerText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    console.log(`📝 Total lines: ${lines.length}`, lines.slice(0, 5));

    const norm = (l) => (l.startsWith("|") ? l.slice(1).trim() : l);

    const first = norm(lines[0] || "");
    if (!first) {
      console.log("❌ No first line found");
      return null;
    }

    console.log("📝 Component name:", first);
    const root = { name: first, attrs: {}, slots: {} };

    let i = 1;
    while (i < lines.length) {
      const line = norm(lines[i]);

      const slotStart = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*$/);
      if (slotStart) {
        const slotName = slotStart[1];
        console.log(`🎰 Found slot: ${slotName}`);
        const children = [];
        i++;

        while (i < lines.length) {
          const l2 = norm(lines[i]);
          if (l2 === `/${slotName}`) break;

          if (!l2.includes(":") && !l2.startsWith("/")) {
            const child = { name: l2, attrs: {}, slots: {} };
            console.log(`  👶 Child component: ${l2}`);
            i++;

            while (i < lines.length) {
              const look = norm(lines[i]);
              if (look === `/${slotName}`) break;
              if (!look.includes(":") && !look.startsWith("/")) break;

              const kv = look.match(/^([a-zA-Z0-9_-]+)\s*:\s*([\s\S]*)$/);
              if (kv) {
                child.attrs[kv[1]] = kv[2] ? kv[2].trim() : "";
                console.log(`    ⚙️ ${kv[1]}: ${kv[2] ? kv[2].trim().substring(0, 50) : "(empty)"}...`);
              }
              i++;
            }

            children.push(child);
            continue;
          }

          i++;
        }

        root.slots[slotName] = children;
        console.log(`✅ Slot ${slotName} has ${children.length} children`);

        while (i < lines.length && norm(lines[i]) !== `/${slotName}`) i++;
        i++;
        continue;
      }

      const kv = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*([\s\S]*)$/);
      if (kv) {
        root.attrs[kv[1]] = kv[2] ? kv[2].trim() : "";
        console.log(`⚙️ Root attr: ${kv[1]}: "${kv[2] ? kv[2].trim().substring(0, 50) : "(empty)"}"`);
      }

      i++;
    }

    console.log("✅ Parsed AST:", root);
    return root;
  }

  /**
   * Extract URL from HTML or return as-is if already a URL
   * Examples:
   *   - "<a href='/kontakt'>link</a>" → "/kontakt"
   *   - "/kontakt" → "/kontakt"
   *   - "https://example.com" → "https://example.com"
   */
  function extractURL(html) {
    if (!html) return '';
    
    // Already a plain URL
    if (!html.includes('<')) {
      return html;
    }
    
    // Extract from <a href="...">
    const match = html.match(/href=["']([^"']+)["']/);
    if (match) {
      return match[1];
    }
    
    return html;
  }

  /**
   * Fill component fields with attribute values
   * Handles three types of directives:
   * 
   * 1. component-visibility="attr-name"
   *    Removes element from DOM if attrs[attr-name] is "false"
   *    Example: component-visibility="heading-visibility" 
   *             removes wrapper if heading-visibility: false in blog
   * 
   * 2. component-url="attr-name"
   *    Sets href on anchor element from attrs[attr-name] value
   *    Extracts URL from HTML if needed
   *    Example: component-url="btn-link" sets href from btn-link attribute
   * 
   * 3. component-field="attr-name"
   *    Sets innerHTML of element from attrs[attr-name] value
   *    Example: component-field="heading" sets content from heading attribute
   */
  function fillFields(node, attrs) {
    // 1. Handle component-visibility FIRST (remove elements before processing)
    node.querySelectorAll("[component-visibility]").forEach((el) => {
      const attrName = el.getAttribute("component-visibility").trim();
      if (!attrName) return;
      
      const value = attrs[attrName];
      console.log(`  👁️ Checking component-visibility="${attrName}" (value: "${value}")`);
      
      // Remove if explicitly false
      if (value === 'false' || value === false) {
        console.log(`  👻 Removing element (${attrName} = false)`);
        el.remove();
      } else {
        console.log(`  ✅ Keeping element (${attrName} = ${value})`);
      }
    });

    // 2. Handle component-url
    node.querySelectorAll("[component-url]").forEach((el) => {
      const attrName = el.getAttribute("component-url").trim();
      if (!attrName) return;
      if (!(attrName in attrs)) return;
      
      const value = attrs[attrName];
      const url = extractURL(value);
      
      console.log(`  🔗 Setting URL: ${attrName} = "${value}" → "${url}"`);
      
      if (el.tagName === "A") {
        el.href = url;
      } else {
        console.warn(`  ⚠️ component-url="${attrName}" on non-anchor element:`, el.tagName);
      }
    });

    // 3. Handle component-field
    node.querySelectorAll("[component-field]").forEach((el) => {
      const attrName = el.getAttribute("component-field").trim();
      if (!attrName) return;
      
      // Set field even if empty (to clear placeholder text)
      const val = attrName in attrs ? attrs[attrName] : "";
      
      console.log(`  🎨 Setting field "${attrName}" = "${val.substring(0, 50)}..."`);

      if (el.tagName === "IMG") {
        if (val) el.src = val;
        const altKey = `${attrName}-alt`;
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
    console.log(`🎨 Rendering component: ${ast.name}`);
    const tpl = templates[ast.name];
    if (!tpl) {
      console.log(`❌ Template not found: ${ast.name}`);
      console.log(`   Available templates:`, Object.keys(templates));
      return null;
    }

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

    console.log(`✅ Component rendered: ${ast.name}`);
    return clone;
  }

  function convertPipeToNewline(text) {
    console.log("🔧 Converting pipe format to newline format");
    let converted = text.replace(/\|/g, "\n|");
    return converted;
  }

  function needsPipeConversion(text) {
    const lines = text.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("|") && (trimmed.match(/\|/g) || []).length > 1) {
        return true;
      }
    }
    return false;
  }

  function getFullHTML(element) {
    return element.innerHTML.trim();
  }

  function replaceInRichTextElements() {
    const richTextElements = document.querySelectorAll(".w-richtext");
    console.log(`🔍 Found ${richTextElements.length} .w-richtext elements`);
    
    richTextElements.forEach((richTextEl, idx) => {
      console.log(`\n📄 Processing richtext element ${idx + 1}`);
      
      let i = 0;
      while (i < richTextEl.children.length) {
        const children = Array.from(richTextEl.children);
        const child = children[i];
        const html = getFullHTML(child);
        
        console.log(`  [${i}] Tag: ${child.tagName}, HTML: "${html.substring(0, 50)}..."`);
        
        if (html.startsWith("{{")) {
          console.log(`  🎯 Found element starting with {{ at index ${i}`);
          
          const componentElements = [child];
          let componentText = html.substring(2);
          let foundEnd = false;
          
          if (html.includes("}}")) {
            console.log(`  ✅ Found }} in same element`);
            componentText = html.substring(2, html.indexOf("}}"));
            foundEnd = true;
          } else {
            let j = i + 1;
            while (j < children.length) {
              const nextChild = children[j];
              const nextHTML = getFullHTML(nextChild);
              
              componentElements.push(nextChild);
              
              if (nextHTML.includes("}}")) {
                console.log(`  ✅ Found }} at index ${j}`);
                componentText += "\n" + nextHTML.substring(0, nextHTML.indexOf("}}"));
                foundEnd = true;
                j++;
                break;
              }
              
              componentText += "\n" + nextHTML;
              j++;
            }
          }
          
          if (foundEnd) {
            console.log(`  📝 Component text collected (${componentText.length} chars)`);
            console.log(`  📝 Preview: ${componentText.substring(0, 200)}...`);
            
            if (needsPipeConversion(componentText)) {
              console.log(`  🔧 Converting pipe format...`);
              componentText = convertPipeToNewline(componentText);
            }
            
            const ast = parseComponentDoc(componentText);
            
            if (ast) {
              const componentNode = renderComponent(ast);
              
              if (componentNode) {
                console.log(`  ✅ Inserting component into DOM`);
                richTextEl.insertBefore(componentNode, componentElements[0]);
                
                console.log(`  🗑️ Removing ${componentElements.length} elements`);
                componentElements.forEach(el => el.remove());
                
                console.log(`  🔄 Component inserted, continuing from index ${i}`);
                continue;
              }
            }
          }
        }
        
        i++;
      }
    });
    
    console.log("\n🏁 Replacement complete");
  }

  function init() {
    console.log("🚀 Initializing...");
    injectBaseStyles();
    loadTemplates();
    replaceInRichTextElements();
    console.log("✅ Initialization complete");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();