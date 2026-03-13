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

  function loadTemplates() {
    document.querySelectorAll("[component-template]").forEach((el) => {
      const name = (el.getAttribute("component-template") || "").trim();
      if (!name) return;

      templates[name] = { el };
    });
  }

  function parseComponentDoc(innerText) {
    innerText = innerText.replace(/<br\s*\/?>/gi, '\n');
    
    const lines = innerText.split('\n').map(l => l.trim()).filter(l => l);
  
    const norm = (l) => {
      const isClose = l.startsWith("|/");
      if (isClose) {
        const componentName = l.slice(2).trim();
        return { componentName, slotName: null, isClose: true };
      }
      
      const withoutPipe = l.startsWith("|") ? l.slice(1).trim() : l.trim();
      
      const slotMatch = withoutPipe.match(/^([a-zA-Z0-9_-]+)\s+@([a-zA-Z0-9_-]+)$/);
      if (slotMatch) {
        console.log(`✅ PARSE SLOT: "${withoutPipe}" → component="${slotMatch[1]}", slot="${slotMatch[2]}"`);
        return { componentName: slotMatch[1], slotName: slotMatch[2], isClose: false };
      }
      
      if (withoutPipe.includes('icon')) {
        console.log(`❌ NO SLOT MATCH: "${withoutPipe}" (expected format: "component @slot")`);
      }
      
      return { componentName: withoutPipe, slotName: null, isClose: false };
    };
  
    const firstParsed = norm(lines[0] || "");
    if (!firstParsed.componentName) return null;
  
    const root = { name: firstParsed.componentName, attrs: {}, children: [], ordered: [] }; // NEU: ordered array
    
    const stack = [root];
    
    let currentSlotTarget = null;
    
    for (let i = 1; i < lines.length; i++) {
      const parsed = norm(lines[i]);
      const line = parsed.componentName;
      
      if (!line || line.trim() === '') {
        continue;
      }
      
      if (parsed.isClose) {
        let found = false;
        while (stack.length > 1) {
          const popped = stack.pop();
          if (popped.name === line) {
            found = true;
            break;
          }
        }
        if (!found) {
        }
        continue;
      }
      
      if (line.startsWith('@')) {
        currentSlotTarget = line.substring(1).trim();
        continue;
      }
      
      const headingMatch = line.match(/^(H[1-6])-(XXL|XL|L|M|S|XS|XXS)\s*->\s*heading\s*:\s*([\s\S]*)$/i);
      
      if (headingMatch) {
        const current = stack[stack.length - 1];
        const tag = headingMatch[1].toLowerCase();
        const size = headingMatch[2].toLowerCase();
        const text = headingMatch[3] ? headingMatch[3].trim() : "";
        
        current.attrs['heading'] = text;
        current.attrs['heading-tag'] = tag;
        current.attrs['heading-size'] = size;
        
        // NEU: Track Reihenfolge
        current.ordered.push({ type: 'attr', name: 'heading', value: text });
        
        console.log(`📏 HEADING PARSED: tag=${tag}, size=${size}, text="${text}"`);
        continue;
      }
      
      const attrMatch = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*([\s\S]*)$/);
      
      if (attrMatch) {
        const current = stack[stack.length - 1];
        const attrName = attrMatch[1];
        const attrValue = attrMatch[2] ? attrMatch[2].trim() : "";
        
        current.attrs[attrName] = attrValue;
        
        // NEU: Track Reihenfolge
        current.ordered.push({ type: 'attr', name: attrName, value: attrValue });
        
      } else {
        const componentName = line;
        const current = stack[stack.length - 1];
        
        const newNode = { 
          name: componentName, 
          attrs: {}, 
          children: [], 
          ordered: [], // NEU
          slot: parsed.slotName || null,
          slotTarget: currentSlotTarget
        };
        current.children.push(newNode);
        
        // NEU: Track Reihenfolge
        current.ordered.push({ type: 'component', node: newNode });
        
        stack.push(newNode);
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

  function fillFields(node, attrs, children) {
    const usedSlots = new Set();
    children.forEach(child => {
      if (child.slot) usedSlots.add(child.slot);
      if (child.slotTarget) usedSlots.add(child.slotTarget);
    });
    
    node.querySelectorAll("[component-show]").forEach((el) => {
      const attrName = el.getAttribute("component-show").trim();
      if (!attrName) return;
      
      const hasAttr = attrName in attrs && attrs[attrName] && attrs[attrName].trim() !== '';
      
      if (el.hasAttribute('component-slot')) {
        const slotName = el.getAttribute('component-slot');
        const slotUsed = usedSlots.has(slotName);
        
        if (hasAttr || slotUsed) {
          console.log(`🛡️ PROTECTED: component-slot="${slotName}" (hasAttr: ${hasAttr}, slotUsed: ${slotUsed})`);
          return;
        } else {
          console.log(`🗑️ REMOVING SLOT: component-slot="${slotName}" (no attr AND no slot usage)`);
        }
      }
      
      if (!hasAttr) {
        console.log(`❌ REMOVING: element with component-show="${attrName}" (no value in attrs)`);
        el.remove();
      } else {
        console.log(`✅ KEEPING: element with component-show="${attrName}" (has value: "${attrs[attrName]}")`);
      }
    });

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
      
      if (attrName === "heading" && ("heading-tag" in attrs || "heading-size" in attrs)) {
        const tag = attrs["heading-tag"] || el.tagName.toLowerCase();
        const size = attrs["heading-size"];
        
        const newEl = document.createElement(tag);
        newEl.innerHTML = val;
        
        Array.from(el.attributes).forEach(attr => {
          if (attr.name !== 'component-field') {
            newEl.setAttribute(attr.name, attr.value);
          }
        });
        
        if (size) {
          newEl.classList.add(`h--${size}`);
        }
        
        el.replaceWith(newEl);
        console.log(`📏 HEADING APPLIED: <${tag} class="h--${size}">${val}</${tag}>`);
        return;
      }

      el.innerHTML = val;
    });

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
      return null;
    }

    const clone = tpl.el.cloneNode(true);
    clone.removeAttribute("component-template");
    clone.setAttribute("component-generated", "true");
    clone.classList.add("rtc-component");

    fillFields(clone, ast.attrs, ast.children || []);

    if (ast.children && ast.children.length > 0) {
      // ... existing code for childrenBySlot ...
      
      slotEntries.forEach(([slotName, children]) => {
        const slotEl = clone.querySelector(`[component-slot="${slotName}"]`);
        console.log(`🎯 SLOT RENDER: Looking for slot="${slotName}" in ${ast.name}, found: ${!!slotEl}`);
        if (slotEl) {
          
          // NEU: Verwende ordered array für korrekte Reihenfolge
          if (ast.ordered && ast.ordered.length > 0) {
            // Leere den Slot komplett
            slotEl.innerHTML = '';
            
            // Durchlaufe ordered array
            ast.ordered.forEach((item) => {
              if (item.type === 'attr') {
                // Finde das Template-Element mit component-show für dieses Attribut
                const templateEl = clone.querySelector(`[component-show="${item.name}"]`);
                if (templateEl && item.value && item.value.trim() !== '') {
                  slotEl.appendChild(templateEl.cloneNode(true));
                  console.log(`✅ ADDED (attr): component-show="${item.name}"`);
                }
              } else if (item.type === 'component') {
                // Rendere die Komponente
                const childNode = renderComponent(item.node);
                if (childNode) {
                  slotEl.appendChild(childNode);
                  console.log(`✅ ADDED (component): ${item.node.name}`);
                }
              }
            });
            
          } else {
            // FALLBACK: Alte Logik
            children.forEach((childAst) => {
              const childNode = renderComponent(childAst);
              if (childNode) {
                slotEl.appendChild(childNode);
              }
            });
          }
        }
      });
    }

    return clone;
  }

  function convertPipeToNewline(text) {
    return text.replace(/^(\|\|)/gm, "\n|");
  }

  function needsPipeConversion(text) {
    return false;
  }

  function replaceInRichTextElements() {
    const richTextElements = document.querySelectorAll(".w-richtext");
    
    richTextElements.forEach((richTextEl, idx) => {
      
      let i = 0;
      while (i < richTextEl.children.length) {
        const children = Array.from(richTextEl.children);
        const child = children[i];
        
        
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
            
            const textarea = document.createElement('textarea');
            textarea.innerHTML = componentText;
            componentText = textarea.value;
            
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