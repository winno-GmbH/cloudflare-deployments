(function() {
  console.log('Rich Component Script V9 - Fixed DOM Refresh');

  // Base styles
  const styles = `
    .rich-component { margin: 2rem 0; }
    .rich-keypoints { background: #f8f9fa; padding: 2rem; border-radius: 8px; }
    .rich-keypoints-headline { font-size: 1.5rem; font-weight: bold; margin-bottom: 1.5rem; }
    .rich-keypoints-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; }
    .rich-keypoint { display: flex; gap: 1rem; align-items: flex-start; }
    .rich-keypoint-icon { width: 48px; height: 48px; flex-shrink: 0; }
    .rich-keypoint-content { flex: 1; }
    .rich-keypoint-title { font-weight: bold; margin-bottom: 0.5rem; }
    .rich-cta { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; border-radius: 12px; text-align: center; }
    .rich-cta-heading { font-size: 1.75rem; font-weight: bold; margin-bottom: 1rem; }
    .rich-cta-intro { font-size: 1.125rem; margin-bottom: 1.5rem; opacity: 0.95; }
    .rich-cta-btn { display: inline-block; background: white; color: #667eea; padding: 1rem 2rem; border-radius: 8px; font-weight: bold; text-decoration: none; transition: transform 0.2s; }
    .rich-cta-btn:hover { transform: translateY(-2px); }
  `;
  
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
  console.log('✅ Base styles injected');

  // Load templates
  const templates = {};
  document.querySelectorAll('[data-rich-component]').forEach(el => {
    const name = el.getAttribute('data-rich-component');
    const slots = Array.from(el.querySelectorAll('[data-slot]')).map(slot => slot.getAttribute('data-slot'));
    templates[name] = slots;
    console.log(`✅ Loaded template: ${name}`, slots);
  });
  console.log('📋 Total templates loaded:', Object.keys(templates));

  // Parser
  function parseComponentDoc(text) {
    console.log('🔍 Parsing component doc:', text.substring(0, 100) + '...');
    
    const lines = text.split('\n')
      .map(l => l.trim())
      .filter(l => l && l !== '}}');
    
    console.log('📝 Total lines:', lines.length, lines.slice(0, 5));

    if (lines.length === 0 || !lines[0].startsWith('|')) {
      console.log('❌ Invalid format');
      return null;
    }

    const componentName = lines[0].replace(/^\|\s*/, '').trim();
    console.log('📝 Component name:', componentName);

    const ast = { name: componentName, attrs: {}, slots: {} };
    let currentSlot = null;
    let currentChild = null;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      if (line === '| /items') {
        if (currentChild) {
          ast.slots[currentSlot].push(currentChild);
          currentChild = null;
        }
        console.log(`✅ Slot ${currentSlot} has ${ast.slots[currentSlot].length} children`);
        currentSlot = null;
        continue;
      }

      if (line.startsWith('| ') && line.includes(':') && !currentSlot) {
        const match = line.match(/^\|\s*([^:]+):\s*(.+)$/);
        if (match) {
          const [, key, val] = match;
          currentSlot = key.trim();
          if (templates[componentName]?.includes(currentSlot)) {
            ast.slots[currentSlot] = [];
            console.log('🎰 Found slot:', currentSlot);
          } else {
            ast.attrs[currentSlot] = val.trim();
            console.log(`⚙️ Root attr: ${currentSlot}: ${val.trim().substring(0, 50)}...`);
            currentSlot = null;
          }
        }
        continue;
      }

      if (currentSlot && line.startsWith('| ') && !line.includes(':')) {
        if (currentChild) {
          ast.slots[currentSlot].push(currentChild);
        }
        const childName = line.replace(/^\|\s*/, '').trim();
        currentChild = { name: childName, attrs: {} };
        console.log('  👶 Child component:', childName);
        continue;
      }

      if (currentChild && line.startsWith('| ') && line.includes(':')) {
        const match = line.match(/^\|\s*([^:]+):\s*(.+)$/);
        if (match) {
          const [, key, val] = match;
          currentChild.attrs[key.trim()] = val.trim();
          console.log(`    ⚙️ ${key.trim()}: ${val.trim().substring(0, 50)}...`);
        }
      }
    }

    if (currentChild && currentSlot) {
      ast.slots[currentSlot].push(currentChild);
    }

    console.log('✅ Parsed AST:', ast);
    return ast;
  }

  // Renderer
  function renderComponent(ast) {
    if (!ast || !ast.name) return null;

    const templateEl = document.querySelector(`[data-rich-component="${ast.name}"]`);
    if (!templateEl) {
      console.log(`❌ Template not found: ${ast.name}`);
      return null;
    }

    console.log('🎨 Rendering component:', ast.name);
    const clone = templateEl.cloneNode(true);
    clone.removeAttribute('data-rich-component');
    clone.classList.add('rich-component');

    // Set attributes
    Object.entries(ast.attrs).forEach(([key, value]) => {
      const attrEl = clone.querySelector(`[data-attr="${key}"]`);
      if (attrEl) {
        if (key.endsWith('-visibility')) {
          attrEl.style.display = value === 'true' ? '' : 'none';
        } else if (key.endsWith('-link')) {
          attrEl.innerHTML = value;
        } else {
          attrEl.textContent = value;
        }
      }
    });

    // Render slots
    Object.entries(ast.slots).forEach(([slotName, children]) => {
      const slotEl = clone.querySelector(`[data-slot="${slotName}"]`);
      if (slotEl) {
        slotEl.innerHTML = '';
        children.forEach(child => {
          const childEl = renderComponent(child);
          if (childEl) slotEl.appendChild(childEl);
        });
      }
    });

    console.log('✅ Component rendered:', ast.name);
    return clone;
  }

  // Main processing
  console.log('🚀 Initializing...');
  
  const richTextElements = document.querySelectorAll('.w-richtext');
  console.log(`🔍 Found ${richTextElements.length} .w-richtext elements`);

  richTextElements.forEach((element, idx) => {
    console.log(`\n📄 Processing richtext element ${idx + 1}`);
    
    // Process components in a loop that restarts after each successful render
    let foundComponent = true;
    let iterations = 0;
    const maxIterations = 100; // Safety limit
    
    while (foundComponent && iterations < maxIterations) {
      foundComponent = false;
      iterations++;
      
      const children = Array.from(element.children);
      console.log(`  🔄 Iteration ${iterations}: ${children.length} children`);

      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const text = child.textContent.trim();

        // Check if this element starts with {{
        if (text.startsWith('{{')) {
          console.log(`  🎯 Found {{ at index ${i} (iteration ${iterations})`);

          // Find the closing }}
          let endIndex = i;
          let foundClosing = false;

          for (let j = i; j < children.length; j++) {
            const endText = children[j].textContent.trim();
            if (endText === '}}') {
              endIndex = j;
              foundClosing = true;
              console.log(`  ✅ Found }} at index ${j}`);
              break;
            }
          }

          if (!foundClosing) {
            console.log('  ❌ No closing }} found, skipping');
            continue;
          }

          // Collect all text between {{ and }}
          let componentText = '';
          for (let k = i + 1; k < endIndex; k++) {
            const lineText = children[k].textContent.trim();
            componentText += lineText + '\n';
          }

          console.log(`  📝 Component text collected (${componentText.length} chars)`);

          // Parse and render component
          const ast = parseComponentDoc(componentText);
          if (ast) {
            const componentElement = renderComponent(ast);

            if (componentElement) {
              console.log('  ✅ Inserting component into DOM');
              // Insert before the {{ element
              element.insertBefore(componentElement, children[i]);
              console.log(`  🗑️ Removing ${endIndex - i + 1} elements`);
              // Remove all elements from {{ to }} inclusive
              for (let k = i; k <= endIndex; k++) {
                children[k].remove();
              }
              console.log(`  🔄 Component rendered, restarting search`);
              foundComponent = true;
              break; // Break inner loop to restart with fresh children
            }
          }
        }
      }
    }
    
    if (iterations >= maxIterations) {
      console.log('  ⚠️ Reached maximum iterations, stopping to prevent infinite loop');
    } else {
      console.log(`  ✅ Processing complete after ${iterations} iterations`);
    }
  });

})();