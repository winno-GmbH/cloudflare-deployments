(function () {
  console.log("Rich Component Script V19-DEBUG-V4 - Full Text Log");
  
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
    // Replace <br> with newlines
    innerText = innerText.replace(/<br\s*\/?>/gi, '\n');
    
    const lines = innerText.split('\n').map(l => l.trim()).filter(l => l);

    // Parse line: returns { componentName, slots: [{slotName, childName}], isSibling }
    const norm = (l) => {
      // Check for sibling marker
      const isSibling = l.startsWith("||");
      const withoutPipes = isSibling ? l.slice(2).trim() : (l.startsWith("|") ? l.slice(1).trim() : l.trim());
      
      // Pattern: component-name [@slot1 < child1] [@slot2 < child2] ...
      const inlinePattern = /^([a-zA-Z0-9_-]+)((?:\s+@[a-zA-Z0-9_-]+\s*<\s*[a-zA-Z0-9_-]+)*)$/;
      const match = withoutPipes.match(inlinePattern);
      
      if (match) {
        const componentName = match[1];
        const slotsString = match[2];
        
        // Extract all slots
        const slots = [];
        if (slotsString) {
          const slotPattern = /@([a-zA-Z0-9_-]+)\s*<\s*([a-zA-Z0-9_-]+)/g;
          let slotMatch;
          while ((slotMatch = slotPattern.exec(slotsString)) !== null) {
            slots.push({
              slotName: slotMatch[1],
              childName: slotMatch[2]
            });
          }
        }
        
        return { componentName, slots, isSibling };
      }
      
      // Just component name
      return { componentName: withoutPipes, slots: [], isSibling };
    };

    const firstParsed = norm(lines[0] || "");
    if (!firstParsed.componentName) return null;

    // Root AST node
    const root = { name: firstParsed.componentName, attrs: {}, children: [] };
    
    // Add inline slot children to root
    firstParsed.slots.forEach(slot => {
      root.children.push({
        name: slot.childName,
        attrs: {},
        children: [],
        slot: slot.slotName
      });
    });
    
    // Stack to track nesting: [root, child1, child2, ...]
    const stack = [root];
    
    // Flag to mark next component as sibling (for empty || lines)
    let nextIsSibling = false;
    
    for (let i = 1; i < lines.length; i++) {
      const parsed = norm(lines[i]);
      const line = parsed.text;
      
      
      // Check for empty single pipe (broken || syntax from CMS: | on one line, @content on next)
      if (lines[i] === '|' && !line) {
        nextIsSibling = true;
        continue;
      }
      
      // Check if empty but has sibling marker
      if ((!line || line.trim() === '') && parsed.isSibling) {
        nextIsSibling = true;
        continue;
      }
      
      // Skip other empty lines
      if (!line || line.trim() === '') {
        continue;
      }
      
      // Check if it's an attribute (contains :)
      const attrMatch = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*([\s\S]*)$/);
      
      if (attrMatch) {
        // It's an attribute - add to current component
        const current = stack[stack.length - 1];
        current.attrs[attrMatch[1]] = attrMatch[2] ? attrMatch[2].trim() : "";
      } else {
        // It's a nested component name
        
        // Apply the nextIsSibling flag for components
        if (nextIsSibling) {
          parsed.isSibling = true;
          nextIsSibling = false;
        }
        
        const componentName = line;
        const current = stack[stack.length - 1];
        
        if (parsed.isSibling) {
          // Pop once and add as sibling
          stack.pop();
          const parent = stack[stack.length - 1];
          
          const newNode = { name: componentName, attrs: {}, children: [], slot: null };
          parent.children.push(newNode);
          
          // Add inline slot children
          parsed.slots.forEach(slot => {
            newNode.children.push({
              name: slot.childName,
              attrs: {},
              children: [],
              slot: slot.slotName
            });
          });
          
          stack.push(newNode);
        } else {
          // Add as child
          const newNode = { name: componentName, attrs: {}, children: [], slot: null };
          current.children.push(newNode);
          
          // Add inline slot children
          parsed.slots.forEach(slot => {
            newNode.children.push({
              name: slot.childName,
              attrs: {},
              children: [],
              slot: slot.slotName
            });
          });
          
          stack.push(newNode);
        }
      }
    }

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
          }
        } else {
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
        
        console.log(`  🔍 Child ${i}: innerHTML length = ${child.innerHTML.length}`);
        
        // Use innerHTML but convert <br> to newlines
        let html = child.innerHTML.trim();
        html = html.replace(/<br\s*\/?>/gi, '\n');
        
        console.log(`  🔍 HTML starts with: ${html.substring(0, 50)}`);
        
        if (html.startsWith("{{")) {
          console.log(`  ✅ Found component start!`);
          const componentElements = [child];
          let componentText = html.substring(2);
          let foundEnd = false;
          
          if (html.includes("}}")) {
            console.log(`  ✅ Found complete component in one element`);
            componentText = html.substring(2, html.indexOf("}}"));
            foundEnd = true;
          } else {
            console.log(`  🔄 Multi-element component, searching for }}...`);
            let j = i + 1;
            while (j < children.length) {
              const nextChild = children[j];
              let nextHTML = nextChild.innerHTML.trim();
              nextHTML = nextHTML.replace(/<br\s*\/?>/gi, '\n');
              
              console.log(`    📦 Child ${j}: "${nextHTML.substring(0, 50)}" (has }}?: ${nextHTML.includes("}}")})`);
              
              componentElements.push(nextChild);
              
              if (nextHTML.includes("}}")) {
                componentText += "\n" + nextHTML.substring(0, nextHTML.indexOf("}}"));
                foundEnd = true;
                console.log(`    ✅ Found }} at child ${j}, stopping`);
                j++;
                break;
              }
              
              componentText += "\n" + nextHTML;
              j++;
            }
            console.log(`  🏁 Multi-element extraction done, foundEnd: ${foundEnd}`);
          }
          
          if (foundEnd) {
            console.log(`  🎯 Component text (raw):`, componentText);
            
            // Decode HTML entities FIRST (before pipe conversion)
            const textarea = document.createElement('textarea');
            textarea.innerHTML = componentText;
            componentText = textarea.value;
            console.log(`  🔓 Decoded HTML entities:`, componentText);
            
            if (needsPipeConversion(componentText)) {
              componentText = convertPipeToNewline(componentText);
              console.log(`  🔄 Converted pipes to newlines:`, componentText);
            }
            
            console.log(`  📝 Parsing component...`);
            const ast = parseComponentDoc(componentText);
            console.log(`  📊 AST:`, ast);
            
            if (ast) {
              console.log(`  🎨 Rendering component: ${ast.name}`);
              const componentNode = renderComponent(ast);
              console.log(`  ✅ Component rendered:`, componentNode);
              
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
    console.log("Rich Component Script V19-DEBUG-V4 - Full Text Log");
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