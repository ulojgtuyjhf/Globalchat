(function() {
  // Enhanced Language Sync Manager for Global Chat
  const GlobalChatLanguageManager = {
    originalLanguage: document.documentElement.lang || 'en',
    currentLanguage: null,
    isTranslating: false,
    translationTimeout: null,
    chatContainer: document.getElementById('chatContainer'),
    
    initialize: function() {
      // Create necessary elements
      this.createLoadingIndicator();
      this.createGoogleTranslateElement();
      
      // Check saved language preference
      const savedLanguage = localStorage.getItem('preferredLanguage');
      if (savedLanguage && savedLanguage !== this.originalLanguage) {
        this.currentLanguage = savedLanguage;
        this.showLoading();
        // Short delay to ensure DOM is ready
        setTimeout(() => this.loadGoogleTranslateScript(), 100);
      }
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Add additional hiding mechanism
      this.setupTranslateElementHider();
      console.log('Global Chat Language Manager initialized');
      
      // Monitor chat updates to ensure translations apply to new content
      this.monitorChatUpdates();
    },
    
    createLoadingIndicator: function() {
      const loadingOverlay = document.createElement('div');
      loadingOverlay.className = 'language-loading-overlay';
      loadingOverlay.innerHTML = `
        <div class="language-loading-spinner">
          <div class="language-loading-dot"></div>
          <div class="language-loading-dot"></div>
          <div class="language-loading-dot"></div>
        </div>
      `;
      document.body.appendChild(loadingOverlay);
      
      // Add the styles with improved hiding selectors
      const style = document.createElement('style');
      style.textContent = `
        .language-loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(255, 255, 255, 0.7);
          z-index: 9999;
          display: flex;
          justify-content: center;
          align-items: center;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.2s ease;
        }
        
        .language-loading-overlay.active {
          opacity: 1;
          visibility: visible;
        }
        
        .language-loading-spinner {
          display: flex;
          gap: 5px;
        }
        
        .language-loading-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #626262;
          animation: language-loading-bounce 1.4s infinite ease-in-out both;
        }
        
        .language-loading-dot:nth-child(1) {
          animation-delay: -0.32s;
        }
        
        .language-loading-dot:nth-child(2) {
          animation-delay: -0.16s;
        }
        
        @keyframes language-loading-bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
        
        /* Comprehensive Google element hiding */
        .goog-te-banner-frame,
        .goog-te-balloon-frame,
        #goog-gt-tt,
        .goog-tooltip,
        .goog-tooltip:hover,
        .goog-text-highlight,
        .VIpgJd-ZVi9od-l4eHX-hSRGPd,
        .VIpgJd-ZVi9od-ORHb-OEVmcd,
        .VIpgJd-ZVi9od-SmfZ-OEVmcd-tJHJj,
        .goog-te-gadget,
        .goog-logo-link,
        .goog-te-combo,
        .skiptranslate,
        iframe[name="googleTranslateElementInitialIframe"],
        iframe.goog-te-menu-frame,
        iframe.VIpgJd-ZVi9od-SmfZ-OEVmcd-tJHJj,
        .VIpgJd-yAWNEb-L7lbkb,
        #goog-gt-,
        .goog-te-menu-value,
        div#goog-gt-,
        #goog-gt-tt.skiptranslate,
        .goog-te-spinner-pos,
        .goog-te-spinner,
        .goog-te-banner-frame.skiptranslate,
        .goog-te-sectional-gadget {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          height: 0 !important;
          width: 0 !important;
          border: none !important;
          position: absolute !important;
          top: -9999px !important;
          left: -9999px !important;
          pointer-events: none !important;
          max-height: 0 !important;
          max-width: 0 !important;
          transform: scale(0) !important;
        }
        
        body {
          top: 0 !important;
          position: static !important;
        }
        
        /* Additional fixes to prevent any translation UI */
        .VIpgJd-ZVi9od-aZ2wEe-wOHMyf,
        .VIpgJd-ZVi9od-aZ2wEe-OiiCO,
        .VIpgJd-ZVi9od-aZ2wEe {
          display: none !important;
          height: 0 !important;
        }
        
        /* Fix for top bar spacing issue */
        html[translated], 
        body[translated] {
          margin-top: 0 !important;
          padding-top: 0 !important;
        }
      `;
      
      document.head.appendChild(style);
    },
    
    createGoogleTranslateElement: function() {
      // Create hidden Google Translate element
      const translateElement = document.createElement('div');
      translateElement.id = 'google_translate_element';
      translateElement.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:0;height:0;visibility:hidden;opacity:0;pointer-events:none;overflow:hidden;';
      document.body.appendChild(translateElement);
    },
    
    setupTranslateElementHider: function() {
      // Continuous hiding of Google elements
      const hideGoogleElements = () => {
        // List of selectors that Google Translate might create
        const selectors = [
          '.goog-te-banner-frame',
          '.goog-te-menu-frame',
          '.goog-tooltip',
          '.skiptranslate',
          'iframe.goog-te-menu-frame',
          '#goog-gt-tt',
          '.VIpgJd-ZVi9od-l4eHX-hSRGPd',
          '.VIpgJd-ZVi9od-ORHb-OEVmcd',
          '.VIpgJd-ZVi9od-SmfZ-OEVmcd-tJHJj'
        ];
        
        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            if (el && el.style) {
              el.style.display = 'none';
              el.style.visibility = 'hidden';
              el.style.opacity = '0';
              el.style.height = '0';
              el.style.width = '0';
              el.style.border = 'none';
              el.style.position = 'absolute';
              el.style.top = '-9999px';
              el.style.left = '-9999px';
              el.style.pointerEvents = 'none';
            }
          });
        });
        
        // Fix body positioning if Google modified it
        if (document.body.style.top && document.body.style.top !== '0px') {
          document.body.style.top = '0px';
          document.body.style.position = 'static';
        }
      };
      
      // Run immediately
      hideGoogleElements();
      
      // Then set up interval to keep hiding them
      setInterval(hideGoogleElements, 300); // More frequent checks
      
      // Also hide on DOM changes
      const observer = new MutationObserver(hideGoogleElements);
      observer.observe(document.body, { 
        childList: true, 
        subtree: true 
      });
    },
    
    loadGoogleTranslateScript: function() {
      // If already loaded, apply translation directly
      if (window.google && window.google.translate) {
        this.applyTranslation();
        return;
      }
      
      // Define callback for Google Translate
      window.googleTranslateElementInit = () => {
        new google.translate.TranslateElement({
          pageLanguage: this.originalLanguage,
          autoDisplay: false,
          includedLanguages: '', // Load all languages for flexibility
          layout: google.translate.TranslateElement.InlineLayout.SIMPLE
        }, 'google_translate_element');
        
        // Apply translation immediately after init
        setTimeout(() => this.applyTranslation(), 300);
      };
      
      // Load Google Translate script
      const script = document.createElement('script');
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.head.appendChild(script);
      
      // Set timeout to hide loading if translation takes too long
      this.translationTimeout = setTimeout(() => {
        if (this.isTranslating) {
          this.hideLoading();
        }
      }, 5000);
    },
    
    applyTranslation: function() {
      if (!this.currentLanguage || this.currentLanguage === this.originalLanguage) {
        this.hideLoading();
        return;
      }
      
      // Try multiple methods to apply translation
      
      // Method 1: Using the dropdown
      const selectElement = document.querySelector('.goog-te-combo');
      if (selectElement) {
        selectElement.value = this.currentLanguage;
        const event = new Event('change', { bubbles: true });
        selectElement.dispatchEvent(event);
      }
      
      // Method 2: Using cookies
      const domain = window.location.hostname;
      document.cookie = `googtrans=/auto/${this.currentLanguage}; domain=${domain}; path=/;`;
      document.cookie = `googtrans=/auto/${this.currentLanguage}; domain=.${domain}; path=/;`;
      
      // Method 3: Using direct API if available
      if (window.google && window.google.translate && window.google.translate.TranslateElement) {
        try {
          const te = google.translate.TranslateElement.getInstance();
          if (te) {
            te.selectLanguage(this.currentLanguage);
          }
        } catch (e) {
          console.log('Direct translation method failed, using alternatives');
        }
      }
      
      // Monitor DOM for translation changes
      this.monitorTranslationChanges();
    },
    
    monitorTranslationChanges: function() {
      // Check for translation immediately
      const checkTranslation = () => {
        // Various indicators that translation has occurred
        const isTranslated = 
          document.body.classList.contains('translated-ltr') || 
          document.body.classList.contains('translated-rtl') ||
          document.documentElement.classList.contains('translated-ltr') ||
          document.documentElement.classList.contains('translated-rtl') ||
          document.cookie.includes('googtrans') ||
          document.querySelector('.goog-te-banner-frame') !== null ||
          document.querySelector('.skiptranslate') !== null;
        
        if (isTranslated) {
          this.hideLoading();
          return true;
        }
        return false;
      };
      
      // If translation detected immediately
      if (checkTranslation()) return;
      
      // Set up a mutation observer to detect when translation happens
      const translationObserver = new MutationObserver((mutations) => {
        if (checkTranslation()) {
          translationObserver.disconnect();
        }
      });
      
      translationObserver.observe(document.documentElement, {
        attributes: true,
        childList: true,
        subtree: true,
        attributeFilter: ['class']
      });
      
      // Fallback: hide loading after 3 seconds anyway
      setTimeout(() => {
        this.hideLoading();
        translationObserver.disconnect();
      }, 3000);
    },
    
    resetToOriginal: function() {
      // Clear translation cookies
      const domain = window.location.hostname;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${domain}; path=/;`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.${domain}; path=/;`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      
      // Force reload to clear translation (most reliable method)
      location.reload();
    },
    
    // Specifically monitor chat container for new messages
    monitorChatUpdates: function() {
      // Reference to the chat container
      const chatContainer = document.getElementById('chatContainer');
      if (!chatContainer) return;
      
      // Setup mutation observer for chat container
      const chatObserver = new MutationObserver((mutations) => {
        // If we have an active translation, attempt to translate new content
        if (this.currentLanguage && this.currentLanguage !== this.originalLanguage) {
          // Force re-translation on new chat messages
          if (window.google && window.google.translate) {
            // Find any untranslated content (might have .notranslate class or not be in DOM when translation occurred)
            setTimeout(() => {
              // Specific for Global Chat: find message-text elements that might need translation
              document.querySelectorAll('.message-text:not(.translated)').forEach(msgElement => {
                msgElement.classList.add('translated');
                
                // Try to force Google to re-translate this specific element
                if (window.google && window.google.translate && window.google.translate.TranslateElement) {
                  try {
                    google.translate.TranslateElement.getInstance().translatePage();
                  } catch (e) {
                    console.log('Retranslation attempt failed');
                  }
                }
              });
            }, 300);
          }
        }
      });
      
      // Start observing chat for changes (new messages)
      chatObserver.observe(chatContainer, {
        childList: true,
        subtree: true
      });
    },
    
    setupEventListeners: function() {
      // Listen for localStorage changes
      window.addEventListener('storage', (e) => {
        if (e.key === 'preferredLanguage') {
          const newLanguage = e.newValue;
          
          // Only process if language actually changed
          if (newLanguage !== this.currentLanguage) {
            this.currentLanguage = newLanguage;
            
            if (newLanguage && newLanguage !== this.originalLanguage) {
              this.showLoading();
              // If Google Translate already loaded, apply directly
              if (window.google && window.google.translate) {
                this.applyTranslation();
              } else {
                this.loadGoogleTranslateScript();
              }
            } else {
              this.resetToOriginal();
            }
          }
        }
      });
      
      // Listen for color preferences for loading dots
      window.addEventListener('storage', (e) => {
        if (e.key === 'color-value' && e.newValue) {
          const dots = document.querySelectorAll('.language-loading-dot');
          dots.forEach(dot => {
            dot.style.backgroundColor = e.newValue;
          });
        }
      });
      
      // Check for color preference immediately
      const savedColor = localStorage.getItem('color-value');
      if (savedColor) {
        const dots = document.querySelectorAll('.language-loading-dot');
        dots.forEach(dot => {
          dot.style.backgroundColor = savedColor;
        });
      }
      
      // Handle page visibility changes to manage translation UI
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && this.currentLanguage && this.currentLanguage !== this.originalLanguage) {
          this.setupTranslateElementHider();
          
          // Re-apply translation to chat content when coming back to page
          if (window.google && window.google.translate) {
            setTimeout(() => {
              try {
                google.translate.TranslateElement.getInstance().translatePage();
              } catch (e) {
                console.log('Translation refresh failed');
              }
            }, 500);
          }
        }
      });
      
      // Handle after page loads completely
      window.addEventListener('load', () => {
        // Re-hide elements after page is fully loaded
        setTimeout(() => this.setupTranslateElementHider(), 500);
        
        // Listen for new messages specific to Global Chat
        document.addEventListener('message-added', () => {
          if (this.currentLanguage && this.currentLanguage !== this.originalLanguage) {
            // Slight delay to ensure the DOM has updated
            setTimeout(() => {
              if (window.google && window.google.translate) {
                try {
                  google.translate.TranslateElement.getInstance().translatePage();
                } catch (e) {
                  console.log('Failed to translate new message');
                }
              }
            }, 100);
          }
        });
      });
    },
    
    showLoading: function() {
      this.isTranslating = true;
      const overlay = document.querySelector('.language-loading-overlay');
      if (overlay) overlay.classList.add('active');
      
      // Clear any existing timeout
      if (this.translationTimeout) {
        clearTimeout(this.translationTimeout);
      }
    },
    
    hideLoading: function() {
      this.isTranslating = false;
      const overlay = document.querySelector('.language-loading-overlay');
      if (overlay) overlay.classList.remove('active');
      
      // Additional cleaning to hide Google elements
      setTimeout(() => this.setupTranslateElementHider(), 100);
      
      // Clear any existing timeout
      if (this.translationTimeout) {
        clearTimeout(this.translationTimeout);
        this.translationTimeout = null;
      }
    },
    
    // Expose public method to trigger translation
    translateNewContent: function() {
      if (this.currentLanguage && this.currentLanguage !== this.originalLanguage && 
          window.google && window.google.translate) {
        try {
          google.translate.TranslateElement.getInstance().translatePage();
        } catch (e) {
          console.log('Content translation failed');
        }
      }
    }
  };
  
  // Initialize immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GlobalChatLanguageManager.initialize());
  } else {
    GlobalChatLanguageManager.initialize();
  }
  
  // Make manager available globally for chat application to use
  window.GlobalChatLanguageManager = GlobalChatLanguageManager;
  
  // Add a hook to the message creation process in the Global Chat app
  const originalCreateMessageElement = window.createMessageElement;
  if (typeof originalCreateMessageElement === 'function') {
    window.createMessageElement = function(message, messageId) {
      const msgElement = originalCreateMessageElement(message, messageId);
      
      // Trigger translation for new messages
      setTimeout(() => {
        if (window.GlobalChatLanguageManager) {
          window.GlobalChatLanguageManager.translateNewContent();
        }
      }, 100);
      
      return msgElement;
    };
  }
  
  // Hook into chat message insertion
  const originalInsertBefore = Element.prototype.insertBefore;
  Element.prototype.insertBefore = function(newNode, referenceNode) {
    const result = originalInsertBefore.call(this, newNode, referenceNode);
    
    // Check if this is a chat message being inserted
    if (this.id === 'chatContainer' && newNode.classList && newNode.classList.contains('message')) {
      // Create and dispatch a custom event that our translator can listen for
      const event = new CustomEvent('message-added', { detail: { messageElement: newNode } });
      document.dispatchEvent(event);
    }
    
    return result;
  };
})();