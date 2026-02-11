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

  // Normalize Webflow <br> inside the {{ }} into real newlines so we can parse multiline blocks
  function normalizeBlockContent(str) {
    let content = str.slice(2, -2);
    content = content.replace(/<br\s*\/?>/gi, '\n');
    // Sometimes Webflow wraps lines in <div> or <p> depending on editor usage:
    content = content.replace(/<\/p>\s*<p>/gi, '\n');
    content = content.replace(/<\/?p[^>]*>/gi, '\n');
    content = content.replace(/<\/?div[^>]*>/gi, '\n');
    content = content.replace(/&nbsp;/gi, ' ');
    return content.trim();
  }

  // NEW: multiline parser
  // Supports:
  // |key: value
  // |key:
  //   multiline...
  function parseComponentString(str) {
    const content = normalizeBlockContent(str);
    const lines = content.split('\n').map(l => l.replace(/\r/g, ''));

    let componentName = '';
    const attributes = {};

    let currentKey = null;
    let currentVal = [];

    function commit() {
      if (!currentKey) return;
      attributes[currentKey] = currentVal.join('\n').trim();
      currentKey = null;
      currentVal = [];
    }

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const line = raw.trim();

      if (!line) continue;

      // Component name: first line can be "|component" OR "component"
      if (!componentName) {
        if (line.startsWith('|')) {
          componentName = line.slice(1).trim();
        } else {
          componentName = line.trim();
        }
        continue;
      }

      // New key starts with |
      if (line.startsWith('|')) {
        commit();
        const rest = line.slice(1);
        const idx = rest.indexOf(':');
        if (idx > -1) {
          currentKey = rest.slice(0, idx).trim();
          const after = rest.slice(idx + 1).trim();
          if (after) currentVal.push(after);
        } else {
          currentKey = rest.trim();
        }
        continue;
      }

      // Continuation line of current key
      if (currentKey) currentVal.push(raw); // keep original indentation for list parsing
    }

    commit();
    return { componentName, attributes };
  }

  function populateComponent(clone, attributes, propertyDefinitions) {
    clone.querySelectorAll('[component-tag]').forEach(field => {
      const tagFieldName = field.getAttribute('component-tag');
      const newTag = attributes[tagFieldName];
      if (newTag) {
        const newElement = document.createElement(newTag);
        Array.from(field.attributes).forEach(attr => {
          if (attr.name !== 'component-tag') newElement.setAttribute(attr.name, attr.value);
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
        const linkMatch = urlValue.match(/<a[^>]+href=["']([^"']+)["'][^>]*>.*?<\/a>/i);
        field.href = linkMatch ? linkMatch[1] : urlValue;
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
          if (value !== undefined) field.setAttribute(attrName, value);
          field.removeAttribute(attr.name);
        }
      });
    });

    const nl2br = (s) => (s || '').replace(/\n/g, '<br>');

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
        } else if (field.tagName === 'A') {
          if (fieldName === 'url' || fieldName === 'link' || fieldName === 'href') {
            const linkMatch = value.match(/<a[^>]+href=["']([^"']+)["'][^>]*>.*?<\/a>/i);
            field.href = linkMatch ? linkMatch[1] : value;
          } else {
            field.innerHTML = /<[^>]+>/.test(value) ? value.replace(/\n/g, '<br>') : nl2br(value);
          }
        } else {
          field.innerHTML = /<[^>]+>/.test(value) ? value.replace(/\n/g, '<br>') : nl2br(value);
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

  // --- Comparisons extension ---

  function applyVariant(root, variant) {
    const variants = root.querySelectorAll('[component-variant]');
    if (!variants.length) return;
    variants.forEach(el => {
      el.style.display = el.getAttribute('component-variant') === variant ? '' : 'none';
    });
  }

  // Parses list text like:
  // - heading: X
  //   text: Y
  function parseComparisonItems(listText) {
    const lines = (listText || '').split('\n').map(l => l.replace(/\r/g, ''));
    const items = [];
    let current = null;

    function push() {
      if (!current) return;
      const heading = (current.heading || '').trim();
      const text = (current.text || '').trim();
      if (heading || text) items.push({ heading, text });
      current = null;
    }

    for (const raw of lines) {
      const t = raw.trim();
      if (!t) continue;

      if (t.startsWith('-')) {
        push();
        current = { heading: '', text: '' };

        const rest = t.replace(/^-+\s*/, '');
        const idx = rest.indexOf(':');
        if (idx > -1) {
          const k = rest.slice(0, idx).trim();
          const v = rest.slice(idx + 1).trim();
          if (k === 'heading') current.heading = v;
          if (k === 'text') current.text = v;
        }
        continue;
      }

      if (current && t.includes(':')) {
        const idx = t.indexOf(':');
        const k = t.slice(0, idx).trim();
        const v = t.slice(idx + 1).trim();
        if (k === 'heading') current.heading = v;
        if (k === 'text') current.text = v;
        continue;
      }

      // fallback: append to text
      if (current) current.text = (current.text ? current.text + '\n' : '') + t;
    }

    push();
    return items;
  }

  function createRichComparisons(attributes) {
    const wrapperTpl = templates['rich-comparisons'];
    const itemTpl = templates['rich-comparison'];

    if (!wrapperTpl || !itemTpl) return null;

    const wrapper = wrapperTpl.element.cloneNode(true);
    wrapper.removeAttribute('component-template');

    // Populate wrapper fields (headings etc.)
    populateComponent(wrapper, attributes, wrapperTpl.properties);

    const leftSlot = wrapper.querySelector('[component-slot="left-items"]');
    const rightSlot = wrapper.querySelector('[component-slot="right-items"]');

    if (!leftSlot || !rightSlot) {
      // If slot is missing, still return wrapper so you can see it
      return wrapper;
    }

    // Remove only previously generated items (so you can re-render without duplications)
    leftSlot.querySelectorAll('[component-generated="true"]').forEach(n => n.remove());
    rightSlot.querySelectorAll('[component-generated="true"]').forEach(n => n.remove());

    const leftItems = parseComparisonItems(attributes['left-items']);
    const rightItems = parseComparisonItems(attributes['right-items']);

    function makeItem(data, variant) {
      const item = itemTpl.element.cloneNode(true);
      item.removeAttribute('component-template');

      populateComponent(
        item,
        { heading: data.heading || '', text: data.text || '' },
        itemTpl.properties
      );

      item.setAttribute('component-generated', 'true');
      applyVariant(item, variant);
      return item;
    }

    leftItems.forEach(it => leftSlot.appendChild(makeItem(it, 'positive')));
    rightItems.forEach(it => rightSlot.appendChild(makeItem(it, 'negative')));

    // Clean slot attribute on output (optional)
    wrapper.querySelectorAll('[component-slot]').forEach(el => el.removeAttribute('component-slot'));

    return wrapper;
  }

  function createComponentFromString(componentStr) {
    const { componentName, attributes } = parseComponentString(componentStr);

    if (componentName === 'rich-comparisons') {
      return createRichComparisons(attributes);
    }

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
      const regex = /\{\{[\s\S]*?\}\}/g;

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
