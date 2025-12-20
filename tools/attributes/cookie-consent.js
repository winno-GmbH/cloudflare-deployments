(function() {
  'use strict';

  const COOKIE_NAME = 'cookie_consent';
  const COOKIE_EXPIRY = 365;

  // ============================================
  // AUTO-BLOCK SCRIPTS (Finsweet-Style)
  // ============================================
  
const autoBlockScripts = () => {
  document.querySelectorAll('script[data-cookie-consent]').forEach(script => {
    
    // INLINE Scripts: type ist der Marker
    if (!script.src && script.type !== 'text/plain') {
      script.type = 'text/plain';
    }
    
    // EXTERNAL Scripts: data-src ist der Marker
    if (script.src && !script.hasAttribute('data-src')) {
      script.setAttribute('data-src', script.src);
      script.removeAttribute('src');
    }
    
  });
};

  // Block immediately (before any script execution)
  autoBlockScripts();

  // Watch for dynamically added scripts
  const scriptObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.tagName === 'SCRIPT' && 
            node.hasAttribute('data-cookie-consent') && 
            !node.src && 
            node.type !== 'text/plain') {
          node.type = 'text/plain';
          node.setAttribute('data-cookie-blocked', 'true');
        }
      });
    });
  });

  // Start observing
  if (document.documentElement) {
    scriptObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  // ============================================
  // Google Consent Mode v2
  // ============================================
  
  const GoogleConsentMode = {
    init() {
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function() { window.dataLayer.push(arguments); };
      
      gtag('consent', 'default', {
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied',
        'analytics_storage': 'denied',
        'functionality_storage': 'granted',
        'personalization_storage': 'denied',
        'security_storage': 'granted',
        'wait_for_update': 500
      });
      
      console.log('✅ Google Consent Mode v2 initialized');
    },
    
    update(consent) {
      if (!window.gtag) return;
      
      const consentState = {
        'ad_storage': consent.marketing ? 'granted' : 'denied',
        'ad_user_data': consent.marketing ? 'granted' : 'denied',
        'ad_personalization': consent.marketing ? 'granted' : 'denied',
        'analytics_storage': consent.analytics ? 'granted' : 'denied',
        'personalization_storage': consent.analytics ? 'granted' : 'denied',
        'functionality_storage': 'granted',
        'security_storage': 'granted'
      };
      
      gtag('consent', 'update', consentState);
      console.log('✅ Consent updated:', consentState);
    }
  };

  // ============================================
  // Cookie Utilities
  // ============================================
  
  const Cookie = {
    set(name, value, days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/;SameSite=Lax`;
    },
    
    get(name) {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [key, value] = cookie.trim().split('=');
        if (key === name) return decodeURIComponent(value);
      }
      return null;
    },
    
    remove(name) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    }
  };

  // ============================================
  // Consent Manager
  // ============================================
  
  const ConsentManager = {
    consent: null,
    
    init() {
      GoogleConsentMode.init();
      
      const saved = Cookie.get(COOKIE_NAME);
      
      if (saved) {
        try {
          this.consent = JSON.parse(saved);
          GoogleConsentMode.update(this.consent);
          this.loadScripts();
          this.hideBanner();
        } catch (e) {
          console.error('Invalid consent cookie:', e);
          this.showBanner();
        }
      } else {
        this.showBanner();
      }
      
      this.attachEventListeners();
    },
    
    showBanner() {
      const banner = document.querySelector('[data-cookie-banner]');
      if (banner) {
        banner.style.display = 'block';
        banner.classList.add('show');
      }
    },
    
    hideBanner() {
      const banner = document.querySelector('[data-cookie-banner]');
      if (banner) {
        banner.style.display = 'none';
        banner.classList.remove('show');
      }
    },
    
    showModal() {
      const modal = document.querySelector('[data-cookie-modal]');
      if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
        this.updateModalToggles();
      }
    },
    
    hideModal() {
      const modal = document.querySelector('[data-cookie-modal]');
      if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
      }
    },
    
    updateModalToggles() {
      if (!this.consent) return;
      
      const analyticsToggle = document.querySelector('[data-cookie-toggle="analytics"]');
      const marketingToggle = document.querySelector('[data-cookie-toggle="marketing"]');
      
      if (analyticsToggle) analyticsToggle.checked = this.consent.analytics || false;
      if (marketingToggle) marketingToggle.checked = this.consent.marketing || false;
    },
    
    acceptAll() {
      this.saveConsent({
        necessary: true,
        analytics: true,
        marketing: true,
        timestamp: Date.now()
      });
    },
    
    acceptNecessary() {
      this.saveConsent({
        necessary: true,
        analytics: false,
        marketing: false,
        timestamp: Date.now()
      });
    },
    
    saveSettings() {
      const analyticsToggle = document.querySelector('[data-cookie-toggle="analytics"]');
      const marketingToggle = document.querySelector('[data-cookie-toggle="marketing"]');
      
      this.saveConsent({
        necessary: true,
        analytics: analyticsToggle ? analyticsToggle.checked : false,
        marketing: marketingToggle ? marketingToggle.checked : false,
        timestamp: Date.now()
      });
      
      this.hideModal();
    },
    
    saveConsent(consent) {
      this.consent = consent;
      Cookie.set(COOKIE_NAME, JSON.stringify(consent), COOKIE_EXPIRY);
      GoogleConsentMode.update(consent);
      this.hideBanner();
      this.loadScripts();
      
      window.dispatchEvent(new CustomEvent('cookieConsentUpdate', { detail: consent }));
    },
    
    loadScripts() {
      if (!this.consent) return;
      
      document.querySelectorAll('script[data-cookie-consent]').forEach(script => {
        const consentAttr = script.getAttribute('data-cookie-consent');
        if (!consentAttr) return;
        
        // Multi-Category Support
        const requiredCategories = consentAttr.split(',').map(cat => cat.trim());
        
        // OR logic: Load if ANY required category is granted
        const hasConsent = requiredCategories.some(category => {
          if (category === 'necessary') return true;
          return this.consent && this.consent[category] === true;
        });
        
        if (hasConsent) {
          this.executeScript(script);
        }
      });
    },
    
    executeScript(script) {
      if (script.hasAttribute('data-cookie-executed')) return;
      
      const newScript = document.createElement('script');
      
      // Copy all attributes except data-cookie-consent, type, and data-cookie-blocked
      Array.from(script.attributes).forEach(attr => {
        if (attr.name !== 'data-cookie-consent' && 
            attr.name !== 'type' && 
            attr.name !== 'data-cookie-blocked') {
          newScript.setAttribute(attr.name, attr.value);
        }
      });
      
      // Copy innerHTML for inline scripts
      if (script.innerHTML) {
        newScript.innerHTML = script.innerHTML;
      }
      
      // Set type to text/javascript (default, executable)
      newScript.type = 'text/javascript';
      
      // Mark original as executed
      script.setAttribute('data-cookie-executed', 'true');
      
      // Insert and execute
      script.parentNode.insertBefore(newScript, script.nextSibling);
    },
    
    attachEventListeners() {
      document.querySelectorAll('[data-cookie-action="accept-all"]').forEach(btn => {
        btn.addEventListener('click', () => this.acceptAll());
      });
      
      document.querySelectorAll('[data-cookie-action="accept-necessary"]').forEach(btn => {
        btn.addEventListener('click', () => this.acceptNecessary());
      });
      
      document.querySelectorAll('[data-cookie-action="open-settings"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.showModal();
        });
      });
      
      document.querySelectorAll('[data-cookie-action="close-modal"]').forEach(btn => {
        btn.addEventListener('click', () => this.hideModal());
      });
      
      document.querySelectorAll('[data-cookie-action="save-settings"]').forEach(btn => {
        btn.addEventListener('click', () => this.saveSettings());
      });
      
      const overlay = document.querySelector('[data-cookie-modal-overlay]');
      if (overlay) {
        overlay.addEventListener('click', () => this.hideModal());
      }
    },
    
    getConsent() {
      return this.consent;
    },
    
    hasConsent(category) {
      return this.consent && this.consent[category] === true;
    },
    
    revokeConsent() {
      Cookie.remove(COOKIE_NAME);
      this.consent = null;
      GoogleConsentMode.update({ necessary: true, analytics: false, marketing: false });
      location.reload();
    }
  };

  // ============================================
  // Initialize
  // ============================================
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ConsentManager.init());
  } else {
    ConsentManager.init();
  }
  
  // Public API
  window.CookieConsent = {
    getConsent: () => ConsentManager.getConsent(),
    hasConsent: (category) => ConsentManager.hasConsent(category),
    openSettings: () => ConsentManager.showModal(),
    revoke: () => ConsentManager.revokeConsent()
  };

})();