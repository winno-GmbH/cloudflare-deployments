(function () {
  console.log("Rich Component Script V11 - Fixed Order: Fields First, Then Visibility");
  
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

  function extractURL(html) {
    if (!html) return '';
    if (!html.includes('<')) return html;
    
    const match = html.match(/href=["']([^"']+)["']/);
    if (match) return match[1];
    
    return html;
  }

  /**
   * Fill component fields - CRITICAL ORDER:
   * 1. First set all component-field values (text content)
   * 2. Then set all component-url values (links)
   * 3. LAST remove elements with component-visibility="false"
   * 
   * This ensures text is set BEFORE elements are potentially removed
   */
  function fillFields(node, attrs) {
    console.log(`  📋 Filling fields for component, attrs:`, Object.keys(attrs));
    
    // 1. Handle component-field FIRST (set all text content)
    node.querySelectorAll("[component-field]").forEach((el) => {
      const attrName = el.getAttribute("component-field").trim();
      if (!attrName) return;
      
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

    // 2. Handle component-url (set links)
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
        console.warn(`  ⚠️ component-url="${attrName}" on non-anchor:`, el.tagName);
      }
    });

    // 3. Handle component-visibility LAST (remove elements after content is set)
    node.querySelectorAll("[component-visibility]").forEach((el) => {
      const attrName = el.getAttribute("component-visibility").trim();
      if (!attrName) return;
      
      const value = attrs[attrName];
      console.log(`  👁️ Checking component-visibility="${attrName}" value="${value}"`);
      
      // Only remove if EXPLICITLY false
      if (value === 'false' || value === false) {
        console.log(`  👻 Removing element (${attrName} is false)`);
        el.remove();
      } else {
        console.log(`  ✅ Keeping element (${attrName} = ${value || 'undefined'})`);
      }
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
      console.log(`   Available:`, Object.keys(templates));
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
    return text.replace(/\|/g, "\n|");
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
        
        if (html.startsWith("{{")) {
          console.log(`  🎯 Found {{ at index ${i}`);
          
          const componentElements = [child];
          let componentText = html.substring(2);
          let foundEnd = false;
          
          if (html.includes("}}")) {
            componentText = html.substring(2, html.indexOf("}}"));
            foundEnd = true;
          } else {
            let j = i + 1;
            while (j < children.length) {
              const nextChild = children[j];
              const nextHTML = getFullHTML(nextChild);
              
              componentElements.push(nextChild);
              
              if (nextHTML.includes("}}")) {
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
            console.log(`  📝 Component text: ${componentText.length} chars`);
            
            if (needsPipeConversion(componentText)) {
              componentText = convertPipeToNewline(componentText);
            }
            
            const ast = parseComponentDoc(componentText);
            
            if (ast) {
              const componentNode = renderComponent(ast);
              
              if (componentNode) {
                console.log(`  ✅ Inserting component`);
                richTextEl.insertBefore(componentNode, componentElements[0]);
                
                componentElements.forEach(el => el.remove());
                console.log(`  🔄 Continuing from index ${i}`);
                continue;
              }
            }
          }
        }
        
        i++;
      }
    });
    
    console.log("\n🏁 Complete");
  }

  function init() {
    console.log("🚀 Initializing...");
    injectBaseStyles();
    loadTemplates();
    replaceInRichTextElements();
    console.log("✅ Done");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();