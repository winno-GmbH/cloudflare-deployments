(function () {
  console.log("Rich Component Script V1 - Named Slots with @");
  
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

      templates[name] = { el };
    });
    console.log("✅ Loaded templates:", Object.keys(templates));
  }

  function parseComponentDoc(innerText) {
    console.log("🔍 Parsing component doc");
    
    // Convert <br> to newlines first
    innerText = innerText.replace(/<br\s*\/?>/gi, '\n');
    
    // Decode HTML entities (&lt; -> <, &gt; -> >, etc.)
    const textarea = document.createElement('textarea');
    textarea.innerHTML = innerText;
    innerText = textarea.value;
    
    const lines = innerText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    // Parse line: returns { text, isSibling, slot }
    const norm = (l) => {
      // Check for @slot syntax: || @slot-name < component-name OR | @slot-name < component-name
      const slotMatch = l.match(/^(\|\|?)\s*@([a-zA-Z0-9_-]+)\s*<\s*(.+)$/);
      if (slotMatch) {
        const isSibling = slotMatch[1] === "||";
        return { 
          text: slotMatch[3].trim(), 
          isSibling: isSibling,
          slot: slotMatch[2].trim()
        };
      }
      
      // Check for @slot WITHOUT leading pipes (from broken ||<br> lines)
      const slotMatchNoPipe = l.match(/^@([a-zA-Z0-9_-]+)\s*<\s*(.+)$/);
      if (slotMatchNoPipe) {
        return { 
          text: slotMatchNoPipe[2].trim(), 
          isSibling: false, 
          slot: slotMatchNoPipe[1].trim() 
        };
      }
      
      if (l.startsWith("||")) {
        return { text: l.slice(2).trim(), isSibling: true, slot: null };
      }
      if (l.startsWith("|")) {
        return { text: l.slice(1).trim(), isSibling: false, slot: null };
      }
      return { text: l.trim(), isSibling: false, slot: null };
    };

    const firstParsed = norm(lines[0] || "");
    if (!firstParsed.text) return null;

    console.log(`📝 Root component: ${firstParsed.text}`);
    
    // Root AST node
    const root = { name: firstParsed.text, attrs: {}, children: [] };
    
    // Stack to track nesting: [root, child1, child2, ...]
    const stack = [root];
    
    // Flag to mark next component as sibling (for empty || lines)
    let nextIsSibling = false;
    
    for (let i = 1; i < lines.length; i++) {
      const parsed = norm(lines[i]);
      const line = parsed.text;
      
      // Check if empty but has sibling marker
      if ((!line || line.trim() === '') && parsed.isSibling) {
        nextIsSibling = true;
        continue;
      }
      
      // Skip other empty lines
      if (!line || line.trim() === '') {
        continue;
      }
      
      // Apply the nextIsSibling flag
      if (nextIsSibling) {
        parsed.isSibling = true;
        nextIsSibling = false;
      }
      
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
        
        if (parsed.isSibling) {
          // || = Sibling - go back to parent and add new child
          stack.pop();
          const parent = stack[stack.length - 1];
          
          const sibling = { name: componentName, attrs: {}, children: [], slot: parsed.slot };
          parent.children.push(sibling);
          stack.push(sibling);
          
          if (parsed.slot) {
            console.log(`  ${'  '.repeat(stack.length - 1)}🔄 ${componentName} (sibling via || → slot: ${parsed.slot})`);
          } else {
            console.log(`  ${'  '.repeat(stack.length - 1)}🔄 ${componentName} (sibling via ||)`);
          }
        } else if (current.name === componentName) {
          // Same name = sibling - go back to parent and add new child
          stack.pop();
          const parent = stack[stack.length - 1];
          
          const sibling = { name: componentName, attrs: {}, children: [], slot: parsed.slot };
          parent.children.push(sibling);
          stack.push(sibling);
          
          console.log(`  ${'  '.repeat(stack.length - 1)}🔄 ${componentName} (sibling - same name)`);
        } else {
          // Different name = child of current
          const child = { name: componentName, attrs: {}, children: [], slot: parsed.slot };
          current.children.push(child);
          stack.push(child);
          
          if (parsed.slot) {
            console.log(`  ${'  '.repeat(stack.length - 1)}👶 ${componentName} (child → slot: ${parsed.slot})`);
          } else {
            console.log(`  ${'  '.repeat(stack.length - 1)}👶 ${componentName} (child)`);
          }
        }
      }
    }

    console.log("✅ Parsed AST:", root);
    console.log("🔍 FULL AST:", JSON.stringify(root, null, 2));

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
      
      const value = attrs[attrName];
      const hasValue = attrName in attrs && value && value.trim() !== '';
      
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
    console.log(`🎨 Rendering: ${ast.name}${ast.slot ? ` → slot: ${ast.slot}` : ''}`);
    
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
      
      // Group children by slot
      const childrenBySlot = {};
      const defaultChildren = [];
      
      ast.children.forEach((child) => {
        if (child.slot) {
          if (!childrenBySlot[child.slot]) {
            childrenBySlot[child.slot] = [];
          }
          childrenBySlot[child.slot].push(child);
        } else {
          defaultChildren.push(child);
        }
      });
      
      // Render children with specific slots
      Object.keys(childrenBySlot).forEach((slotName) => {
        const slotEl = clone.querySelector(`[component-slot="${slotName}"]`);
        if (slotEl) {
          console.log(`  📍 Found named slot: ${slotName}`);
          slotEl.innerHTML = '';
          
          childrenBySlot[slotName].forEach((childAst) => {
            const childNode = renderComponent(childAst);
            if (childNode) {
              slotEl.appendChild(childNode);
            }
          });
        } else {
          console.warn(`  ⚠️ Named slot "${slotName}" not found in ${ast.name}`);
        }
      });
      
      // Render default children (no slot specified)
      if (defaultChildren.length > 0) {
        // Try to find a default component-slot (without specific name or named "items")
        let slotEl = clone.querySelector('[component-slot="items"]');
        
        // If no "items" slot, try any component-slot
        if (!slotEl) {
          slotEl = clone.querySelector('[component-slot]');
        }
        
        // If no slot found, use the first layout element
        if (!slotEl) {
          slotEl = clone.querySelector('[class*="lyt--"]');
          
          if (!slotEl) {
            console.warn(`  ⚠️ No slot or container found in ${ast.name}, using clone itself`);
            slotEl = clone;
          } else {
            console.log(`  📍 Using layout element as default container`);
          }
        } else {
          console.log(`  📍 Found default component-slot`);
        }
        
        // Clear existing content if it's a slot
        if (slotEl.hasAttribute('component-slot')) {
          slotEl.innerHTML = '';
        }
        
        // Render and append default children
        defaultChildren.forEach((childAst) => {
          const childNode = renderComponent(childAst);
          if (childNode) {
            slotEl.appendChild(childNode);
          }
        });
      }
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