(function() {
  
  const templates = {};
  
  function loadTemplates() {
    document.querySelectorAll('[component-template]').forEach(el => {
      const name = el.getAttribute('component-template');
      
      const properties = {};
      el.querySelectorAll('[component-field]').forEach(field => {
        const fieldName = field.getAttribute('component-field');
        const defaultValue = field.getAttribute('component-default') || '';
        properties[fieldName] = {
          element: field,
          defaultValue: defaultValue || field.textContent.trim() || field.src || ''
        };
      });
      
      templates[name] = {
        element: el.cloneNode(true),
        properties: properties
      };
      
      el.remove();
    });
  }
  
  function parseComponentString(str) {
    const content = str.slice(2, -2).trim();
    const parts = content.split('|').map(p => p.trim());
    const componentName = parts[0];
    
    const attributes = {};
    for (let i = 1; i < parts.length; i++) {
      const [key, ...valueParts] = parts[i].split(':');
      if (key && valueParts.length > 0) {
        attributes[key.trim()] = valueParts.join(':').trim();
      }
    }
    
    return { componentName, attributes };
  }
  
  function populateComponent(clone, attributes, propertyDefinitions) {
    clone.querySelectorAll('[component-field]').forEach(field => {
      const fieldName = field.getAttribute('component-field');
      
      let value = attributes[fieldName];
      if (value === undefined && propertyDefinitions[fieldName]) {
        value = propertyDefinitions[fieldName].defaultValue;
      }
      
      if (value !== undefined) {
        if (field.tagName === 'IMG') {
          field.src = value;
          if (!field.alt) field.alt = value;
        }
        else if (field.tagName === 'A') {
          if (fieldName === 'url' || fieldName === 'link' || fieldName === 'href') {
            field.href = value;
          } else {
            field.textContent = value;
          }
        }
        else {
          field.textContent = value;
        }
      }
      
      field.removeAttribute('component-field');
      field.removeAttribute('component-default');
    });
    
    clone.querySelectorAll('[component-show]').forEach(field => {
      const showFieldName = field.getAttribute('component-show');
      const showValue = attributes[showFieldName];
      
      if (showValue === 'false' || showValue === 'hide' || showValue === '0' || showValue === 'no') {
        field.remove();
      }
      
      field.removeAttribute('component-show');
    });
    
    return clone;
  }
  
  function createComponentFromString(componentStr) {
    const { componentName, attributes } = parseComponentString(componentStr);
    const template = templates[componentName];
    
    if (template) {
      const clone = template.element.cloneNode(true);
      clone.removeAttribute('component-template');
      return populateComponent(clone, attributes, template.properties);
    }
    
    return null;
  }
  
  function replaceComponentStrings() {
    const richTextElements = document.querySelectorAll('.w-richtext, .w-dyn-bind-empty, [class*="rich"]');
    
    richTextElements.forEach(element => {
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      const nodesToReplace = [];
      let node;
      
      while (node = walker.nextNode()) {
        if (node.nodeValue && node.nodeValue.includes('{{')) {
          nodesToReplace.push(node);
        }
      }
      
      nodesToReplace.forEach(textNode => {
        const text = textNode.nodeValue;
        const regex = /\{\{[^}]+\}\}/g;
        const matches = text.match(regex);
        
        if (matches) {
          const fragment = document.createDocumentFragment();
          let lastIndex = 0;
          
          matches.forEach(match => {
            const index = text.indexOf(match, lastIndex);
            
            if (index > lastIndex) {
              fragment.appendChild(document.createTextNode(text.slice(lastIndex, index)));
            }
            
            const component = createComponentFromString(match);
            if (component) {
              fragment.appendChild(component);
            } else {
              fragment.appendChild(document.createTextNode(match));
            }
            
            lastIndex = index + match.length;
          });
          
          if (lastIndex < text.length) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
          }
          
          textNode.parentNode.replaceChild(fragment, textNode);
        }
      });
    });
  }
  
  function init() {
    loadTemplates();
    replaceComponentStrings();
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();