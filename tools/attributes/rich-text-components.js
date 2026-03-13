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
        return { componentName: slotMatch[1], slotName: slotMatch[2], isClose: false };
      }
      
      return { componentName: withoutPipe, slotName: null, isClose: false };
    };
  
    const firstParsed = norm(lines[0] || "");
    if (!firstParsed.componentName) return null;
  
    const root = { 
      name: firstParsed.componentName, 
      attrs: {}, 
      children: [], 
      ordered: [] // ALLE Items in Reihenfolge
    };
    
    const stack = [root];
    let globalOrder = 0;
    let currentSlotTarget = null;
    
    for (let i = 1; i < lines.length; i++) {
      const parsed = norm(lines[i]);
      const line = parsed.componentName;
      
      if (!line || line.trim() === '') continue;
      
      if (parsed.isClose) {
        while (stack.length > 1) {
          const popped = stack.pop();
          if (popped.name === line) break;
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
        
        // Track in ordered array
        current.ordered.push({ 
          type: 'attr', 
          name: 'heading', 
          value: text, 
          order: globalOrder++ 
        });
        continue;
      }
      
      const attrMatch = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*([\s\S]*)$/);
      
      if (attrMatch) {
        const current = stack[stack.length - 1];
        const attrName = attrMatch[1];
        const attrValue = attrMatch[2] ? attrMatch[2].trim() : "";
        
        current.attrs[attrName] = attrValue;
        
        // Track in ordered array
        current.ordered.push({ 
          type: 'attr', 
          name: attrName, 
          value: attrValue, 
          order: globalOrder++ 
        });
        
      } else {
        const componentName = line;
        const current = stack[stack.length - 1];
        
        const newNode = { 
          name: componentName, 
          attrs: {}, 
          children: [], 
          ordered: [],
          slot: parsed.slotName || null,
          slotTarget: currentSlotTarget,
          order: globalOrder++
        };
        current.children.push(newNode);
        
        // Track in ordered array
        current.ordered.push({ 
          type: 'component', 
          node: newNode, 
          order: newNode.order 
        });
        
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
    
    // Funktion: Ist Element innerhalb einer generierten Komponente?
    function isInGeneratedComponent(el, root) {
      let current = el.parentElement;
      while (current && current !== root) {
        if (current.hasAttribute('component-generated') && current !== root) {
          return true; // Element ist in einer verschachtelten generierten Komponente
        }
        current = current.parentElement;
      }
      return false;
    }
    
    node.querySelectorAll("[component-show]").forEach((el) => {
      // Überspringe wenn in verschachtelter generierter Komponente
      if (isInGeneratedComponent(el, node)) return;
      
      const attrName = el.getAttribute("component-show").trim();
      if (!attrName) return;
      
      const hasAttr = attrName in attrs && attrs[attrName] && attrs[attrName].trim() !== '';
      
      if (el.hasAttribute('component-slot')) {
        const slotName = el.getAttribute('component-slot');
        const slotUsed = usedSlots.has(slotName);
        
        if (hasAttr || slotUsed) {
          return;
        }
      }
      
      if (!hasAttr) {
        el.remove();
      }
    });
  
    node.querySelectorAll("[component-field]").forEach((el) => {
      // Überspringe wenn in verschachtelter generierter Komponente
      if (isInGeneratedComponent(el, node)) return;
      
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
        return;
      }
  
      el.innerHTML = val;
    });
  
    node.querySelectorAll("[component-url]").forEach((el) => {
      // Überspringe wenn in verschachtelter generierter Komponente
      if (isInGeneratedComponent(el, node)) return;
      
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
  
    // WICHTIG: fillFields() NACH dem Slot-Füllen aufrufen, nicht vorher!
    // fillFields(clone, ast.attrs, ast.children || []); // ENTFERNT!
  
    if (ast.children && ast.children.length > 0) {
      const childrenBySlot = {};
      const defaultChildren = [];
      
      ast.children.forEach((child) => {
        const targetSlot = child.slot || child.slotTarget;
        if (targetSlot) {
          if (!childrenBySlot[targetSlot]) {
            childrenBySlot[targetSlot] = [];
          }
          childrenBySlot[targetSlot].push(child);
        } else {
          defaultChildren.push(child);
        }
      });
      
      const slotEntries = Object.entries(childrenBySlot);
      slotEntries.sort((a, b) => {
        const [slotNameA] = a;
        const [slotNameB] = b;
        const slotElA = clone.querySelector(`[component-slot="${slotNameA}"]`);
        const slotElB = clone.querySelector(`[component-slot="${slotNameB}"]`);
        
        if (!slotElA || !slotElB) return 0;
        
        const depthA = getElementDepth(slotElA);
        const depthB = getElementDepth(slotElB);
        
        return depthB - depthA;
      });
      
      function getElementDepth(el) {
        let depth = 0;
        let current = el.parentElement;
        while (current && current !== clone) {
          depth++;
          current = current.parentElement;
        }
        return depth;
      }
      
      slotEntries.forEach(([slotName, children]) => {
        const slotEl = clone.querySelector(`[component-slot="${slotName}"]`);
        
        if (slotEl) {
          // Sammle Template-Elemente
          const templateMap = new Map();
          slotEl.querySelectorAll('[component-show]').forEach(el => {
            const attr = el.getAttribute('component-show');
            templateMap.set(attr, el.cloneNode(true));
          });
          
          // Leere Slot
          slotEl.innerHTML = '';
          
          // Verwende ordered array für korrekte Reihenfolge!
          if (ast.ordered && ast.ordered.length > 0) {
            ast.ordered.forEach((item) => {
              if (item.type === 'attr') {
                // Ist das Attribut gesetzt UND gibt es ein Template dafür?
                if (item.value && item.value.trim() !== '' && templateMap.has(item.name)) {
                  const templateEl = templateMap.get(item.name);
                  slotEl.appendChild(templateEl);
                }
              } else if (item.type === 'component') {
                // Rendere Component
                const childNode = renderComponent(item.node);
                if (childNode) {
                  slotEl.appendChild(childNode);
                }
              }
            });
          }
        }
      });
      
      if (defaultChildren.length > 0) {
        let slotEl = clone.querySelector('[component-slot="items"]');
        
        if (!slotEl) {
          slotEl = clone.querySelector('[component-slot]');
        }
        
        if (!slotEl) {
          slotEl = clone.querySelector('[class*="lyt--"]');
          
          if (!slotEl) {
            slotEl = clone;
          }
        }
        
        defaultChildren.forEach((childAst) => {
          const childNode = renderComponent(childAst);
          if (childNode) {
            slotEl.appendChild(childNode);
          }
        });
      }
    }
  
    // JETZT fillFields() aufrufen - NACH dem Slot-Füllen!
    fillFields(clone, ast.attrs, ast.children || []);
  
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