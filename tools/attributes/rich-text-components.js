(function () {
  console.log("Rich Component Script V15 - Simplified Nesting");
  
  const templates = {};
  
  // Components die KEINE Children haben können (Leaf Components)
  const leafComponents = ['icon'];

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

      templates[name] = { el };
    });
    console.log("✅ Loaded templates:", Object.keys(templates));
  }

  function parseComponentDoc(innerText) {
    console.log("🔍 Parsing component doc");
    
    // Convert <br> to newlines first
    innerText = innerText.replace(/<br\s*\/?>/gi, '\n');
    
    const lines = innerText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const norm = (l) => (l.startsWith("|") ? l.slice(1).trim() : l);

    const first = norm(lines[0] || "");
    if (!first) return null;

    console.log(`📝 Root component: ${first}`);
    
    // Root AST node
    const root = { name: first, attrs: {}, children: [] };
    
    // Stack to track nesting: [root, child1, child2, ...]
    const stack = [root];
    
    for (let i = 1; i < lines.length; i++) {
      const line = norm(lines[i]);
      
      // Check if it's an attribute (contains :)
      const attrMatch = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*([\s\S]*)$/);
      
      if (attrMatch) {
        // It's an attribute - add to current component
        const current = stack[stack.length - 1];
        current.attrs[attrMatch[1]] = attrMatch[2] ? attrMatch[2].trim() : "";
        console.log(`  ${'  '.repeat(stack.length - 1)}⚙️ ${attrMatch[1]}: ${attrMatch[2] ? attrMatch[2].trim().substring(0, 30) : "(empty)"}`);
      } else {
        // It's a nested component name
        const componentName = line;
        const current = stack[stack.length - 1];
        
        // Check if it's a sibling (same name as current)
        if (current.name === componentName) {
          // Same name = sibling - go back to parent and add new child
          stack.pop();
          const parent = stack[stack.length - 1];
          
          const sibling = { name: componentName, attrs: {}, children: [] };
          parent.children.push(sibling);
          stack.push(sibling);
          
          console.log(`  ${'  '.repeat(stack.length - 1)}🔄 ${componentName} (sibling)`);
        } else if (leafComponents.includes(current.name)) {
          // Current is a leaf component - new component becomes sibling!
          stack.pop();
          const parent = stack[stack.length - 1];
          
          const sibling = { name: componentName, attrs: {}, children: [] };
          parent.children.push(sibling);
          stack.push(sibling);
          
          console.log(`  ${'  '.repeat(stack.length - 1)}👥 ${componentName} (sibling of leaf)`);
        } else {
          // Different name = child of current
          const child = { name: componentName, attrs: {}, children: [] };
          current.children.push(child);
          stack.push(child);
          
          console.log(`  ${'  '.repeat(stack.length - 1)}👶 ${componentName} (child)`);
        }
      }
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

  function fillFields(node, attrs) {
    // 1. Handle component-show - Remove if attribute doesn't exist or is empty
    node.querySelectorAll("[component-show]").forEach((el) => {
      const attrName = el.getAttribute("component-show").trim();
      if (!attrName) return;
      
      // Remove -visibility suffix if present
      const cleanAttrName = attrName.replace(/-visibility$/, '');
      
      const value = attrs[cleanAttrName];
      const hasValue = cleanAttrName in attrs && value && value.trim() !== '';
      
      console.log(`👁️ component-show="${attrName}" → ${hasValue ? 'KEEP' : 'REMOVE'}`);
      
      if (!hasValue) {
        el.remove();
      }
    });

    // 2. Set text content
    node.querySelectorAll("[component-field]").forEach((el) => {
      const attrName = el.getAttribute("component-field").trim();
      if (!attrName) return;
      
      const val = attrName in attrs ? attrs[attrName] : "";

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

    // 3. Set URLs
    node.querySelectorAll("[component-url]").forEach((el) => {
      const attrName = el.getAttribute("component-url").trim();
      if (!attrName) return;
      if (!(attrName in attrs)) return;
      
      const value = attrs[attrName];
      const url = extractURL(value);
      
      if (el.tagName === "A") {
        el.href = url;
      }
    });
  }

  function renderComponent(ast) {
    console.log(`🎨 Rendering: ${ast.name}`);
    
    const tpl = templates[ast.name];
    if (!tpl) {
      console.error(`❌ Template not found: ${ast.name}`);
      return null;
    }

    const clone = tpl.el.cloneNode(true);
    clone.removeAttribute("component-template");
    clone.setAttribute("component-generated", "true");
    clone.classList.add("rtc-component");

    // Fill fields with this component's attributes
    fillFields(clone, ast.attrs);

    // Render children
    if (ast.children && ast.children.length > 0) {
      console.log(`  📦 ${ast.name} has ${ast.children.length} children`);
      
      // Try to find a component-slot
      let slotEl = clone.querySelector('[component-slot]');
      
      // If no slot found, use the first element that could be a container
      if (!slotEl) {
        // Find the first element that could be a container
        // Usually the .lyt--* element
        slotEl = clone.querySelector('[class*="lyt--"]');
        
        if (!slotEl) {
          console.warn(`  ⚠️ No slot or container found in ${ast.name}, using clone itself`);
          slotEl = clone;
        } else {
          console.log(`  📍 Using layout element as container`);
        }
      } else {
        console.log(`  📍 Found component-slot`);
      }
      
      // Clear existing content if it's a slot
      if (slotEl.hasAttribute('component-slot')) {
        slotEl.innerHTML = '';
      }
      
      // Render and append children
      ast.children.forEach((childAst) => {
        const childNode = renderComponent(childAst);
        if (childNode) {
          slotEl.appendChild(childNode);
        }
      });
    }

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

  function replaceInRichTextElements() {
    const richTextElements = document.querySelectorAll(".w-richtext");
    console.log(`🔍 Found ${richTextElements.length} .w-richtext elements`);
    
    richTextElements.forEach((richTextEl, idx) => {
      console.log(`\n📄 Processing element ${idx + 1}`);
      
      let i = 0;
      while (i < richTextEl.children.length) {
        const children = Array.from(richTextEl.children);
        const child = children[i];
        
        // Use innerHTML but convert <br> to newlines
        let html = child.innerHTML.trim();
        html = html.replace(/<br\s*\/?>/gi, '\n');
        
        if (html.startsWith("{{")) {
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
              let nextHTML = nextChild.innerHTML.trim();
              nextHTML = nextHTML.replace(/<br\s*\/?>/gi, '\n');
              
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
            if (needsPipeConversion(componentText)) {
              componentText = convertPipeToNewline(componentText);
            }
            
            const ast = parseComponentDoc(componentText);
            
            if (ast) {
              const componentNode = renderComponent(ast);
              
              if (componentNode) {
                richTextEl.insertBefore(componentNode, componentElements[0]);
                componentElements.forEach(el => el.remove());
                continue;
              }
            }
          }
        }
        
        i++;
      }
    });
    
    console.log("✅ Done");
  }

  function init() {
    console.log("🚀 Initializing Rich Components");
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