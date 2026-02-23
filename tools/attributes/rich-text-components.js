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

    const root = { name: firstParsed.componentName, attrs: {}, children: [] };
    
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
      
      const attrMatch = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*([\s\S]*)$/);
      
      if (attrMatch) {
        const current = stack[stack.length - 1];
        current.attrs[attrMatch[1]] = attrMatch[2] ? attrMatch[2].trim() : "";
      } else {
        const componentName = line;
        const current = stack[stack.length - 1];
        
        const newNode = { 
          name: componentName, 
          attrs: {}, 
          children: [], 
          slot: parsed.slotName || null,
          slotTarget: currentSlotTarget
        };
        current.children.push(newNode);
        
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

  function fillFields(node, attrs) {
    node.querySelectorAll("[component-show]").forEach((el) => {
      const attrName = el.getAttribute("component-show").trim();
      if (!attrName) return;
      
      if (el.hasAttribute('component-slot')) {
        return;
      }
      
      const value = attrs[attrName];
      const hasValue = attrName in attrs && value && value.trim() !== '';
      
      
      if (!hasValue) {
        el.remove();
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

    fillFields(clone, ast.attrs);

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
        if (slotName === 'icon') {
        }
        if (slotEl) {
          
          children.forEach((childAst) => {
            const childNode = renderComponent(childAst);
            if (childNode) {
              slotEl.appendChild(childNode);
              if (childAst.name === 'icon') {
              }
            }
          });
        } else {
          if (slotName === 'icon') {
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
          } else {
          }
        } else {
        }
        
        if (slotEl.hasAttribute('component-slot')) {
          slotEl.innerHTML = '';
        }
        
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