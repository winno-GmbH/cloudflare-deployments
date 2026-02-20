(function () {
  console.log("Rich Component Script V5 - Multi-scenario Debug");
  
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
                child.attrs[kv[1]] = kv[2].trim();
                console.log(`    ⚙️ ${kv[1]}: ${kv[2].trim().substring(0, 50)}...`);
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
        root.attrs[kv[1]] = kv[2].trim();
        console.log(`⚙️ Root attr: ${kv[1]}: ${kv[2].trim().substring(0, 50)}...`);
      }

      i++;
    }

    console.log("✅ Parsed AST:", root);
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
    console.log(`🎨 Rendering component: ${ast.name}`);
    const tpl = templates[ast.name];
    if (!tpl) {
      console.log(`❌ Template not found: ${ast.name}`);
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

  // NEW: Extract component blocks from text that might contain {{ }} inline
  function extractComponentBlocks(text) {
    const blocks = [];
    const regex = /\{\{([\s\S]*?)\}\}/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      blocks.push({
        fullMatch: match[0],
        content: match[1].trim(),
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }
    
    return blocks;
  }

  function replaceInRichTextElements() {
    const richTextElements = document.querySelectorAll(".w-richtext");
    console.log(`🔍 Found ${richTextElements.length} .w-richtext elements`);
    
    richTextElements.forEach((richTextEl, idx) => {
      console.log(`\n📄 Processing richtext element ${idx + 1}`);
      const children = Array.from(richTextEl.children);
      console.log(`  👶 Has ${children.length} children`);
      
      let i = 0;
      while (i < children.length) {
        const child = children[i];
        const text = child.textContent.trim();
        
        console.log(`  [${i}] Tag: ${child.tagName}, Text: "${text.substring(0, 50)}..."`);
        
        // Check if this element contains {{ and }}
        if (text.includes("{{") && text.includes("}}")) {
          console.log(`  🎯 Found component block(s) in single element at index ${i}`);
          
          const blocks = extractComponentBlocks(text);
          console.log(`  📦 Extracted ${blocks.length} component block(s)`);
          
          if (blocks.length > 0) {
            const fragment = document.createDocumentFragment();
            
            blocks.forEach((block, blockIdx) => {
              console.log(`  🔄 Processing block ${blockIdx + 1}:`, block.content.substring(0, 50) + "...");
              const ast = parseComponentDoc(block.content);
              
              if (ast) {
                const componentNode = renderComponent(ast);
                if (componentNode) {
                  fragment.appendChild(componentNode);
                  console.log(`  ✅ Block ${blockIdx + 1} rendered and added`);
                }
              }
            });
            
            // Replace the element with the rendered components
            child.parentNode.insertBefore(fragment, child);
            child.remove();
            console.log(`  🗑️ Removed original element`);
            continue;
          }
        }
        
        // SCENARIO 2: Check for separate {{ element
        if (text === "{{") {
          console.log(`  🎯 Found {{ at index ${i} (separate elements)`);
          const componentElements = [child];
          const componentLines = [];
          let foundEnd = false;
          
          let j = i + 1;
          while (j < children.length) {
            const nextChild = children[j];
            const nextText = nextChild.textContent.trim();
            
            componentElements.push(nextChild);
            
            if (nextText === "}}") {
              console.log(`  🎯 Found }} at index ${j}`);
              foundEnd = true;
              j++;
              break;
            }
            
            componentLines.push(nextText);
            j++;
          }
          
          console.log(`  📝 Collected ${componentLines.length} lines`);
          
          if (foundEnd && componentLines.length > 0) {
            const componentText = componentLines.join("\n");
            console.log(`  🔄 Parsing component text...`);
            const ast = parseComponentDoc(componentText);
            
            if (ast) {
              console.log(`  🎨 Rendering component...`);
              const componentNode = renderComponent(ast);
              
              if (componentNode) {
                console.log(`  ✅ Inserting component into DOM`);
                richTextEl.insertBefore(componentNode, componentElements[0]);
                
                console.log(`  🗑️ Removing ${componentElements.length} elements`);
                componentElements.forEach(el => el.remove());
                
                i = Array.from(richTextEl.children).indexOf(componentNode) + 1;
                console.log(`  ⏭️ Continuing from index ${i}`);
                continue;
              }
            }
          }
          
          i = j;
          continue;
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