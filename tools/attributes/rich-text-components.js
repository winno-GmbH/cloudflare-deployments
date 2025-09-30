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
        let value = valueParts.join(':').trim();
        
        const linkMatch = value.match(/<a[^>]+href=["']([^"']+)["'][^>]*>.*?<\/a>/i);
        if (linkMatch) {
          value = linkMatch[1];
        }
        
        attributes[key.trim()] = value;
      }
    }
    
    return { componentName, attributes };
  }
  
  function populateComponent(clone, attributes, propertyDefinitions) {
    clone.querySelectorAll('[component-tag]').forEach(field => {
      const tagFieldName = field.getAttribute('component-tag');
      const newTag = attributes[tagFieldName];
      
      if (newTag) {
        const newElement = document.createElement(newTag);
        Array.from(field.attributes).forEach(attr => {
          if (attr.name !== 'component-tag') {
            newElement.setAttribute(attr.name, attr.value);
          }
        });
        newElement.innerHTML = field.innerHTML;
        field.parentNode.replaceChild(newElement, field);
      } else {
        field.removeAttribute('component-tag');
      }
    });
    
    clone.querySelectorAll('[component-url]').forEach(field => {
      const urlFieldName = field.getAttribute('component-url');
      const urlValue = attributes[urlFieldName];
      
      if (urlValue !== undefined) {
        field.href = urlValue;
      }
      
      field.removeAttribute('component-url');
    });
    
    const allElements = clone.querySelectorAll('*');
    allElements.forEach(field => {
      Array.from(field.attributes).forEach(attr => {
        if (attr.name.startsWith('component-attr-')) {
          const attrName = attr.name.replace('component-attr-', '');
          const fieldName = attr.value;
          const value = attributes[fieldName];
          
          if (value !== undefined) {
            field.setAttribute(attrName, value);
          }
          
          field.removeAttribute(attr.name);
        }
      });
    });
    
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
            const linkMatch = value.match(/<a[^>]+href=["']([^"']+)["'][^>]*>.*?<\/a>/i);
            if (linkMatch) {
              field.href = linkMatch[1];
            } else {
              field.href = value;
            }
          } else {
            field.innerHTML = value;
          }
        }
        else {
          if (value.includes('<a')) {
            field.innerHTML = value;
          } else {
            field.textContent = value;
          }
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
      let html = element.innerHTML;
      const regex = /\{\{[^}]*(?:<a[^>]*>[^<]*<\/a>)?[^}]*\}\}/g;
      
      html = html.replace(regex, (match) => {
        const component = createComponentFromString(match);
        if (component) {
          const temp = document.createElement('div');
          temp.appendChild(component);
          return temp.innerHTML;
        }
        return match;
      });
      
      element.innerHTML = html;
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