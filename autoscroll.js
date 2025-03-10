
(() => {
  document.addEventListener('DOMContentLoaded', () => {
    // Create unique namespace to avoid conflicts
    const scrollManager = {
      uniqueId: `scroll-${Math.random().toString(36).substr(2, 9)}`,
      
      createButton() {
        const button = document.createElement('button');
        button.innerHTML = '↓';
        button.id = this.uniqueId;
        button.classList.add(`${this.uniqueId}-btn`);
        button.setAttribute('aria-label', 'Scroll to bottom');
        return button;
      },
      
      createStyles() {
        const style = document.createElement('style');
        style.textContent = `
          @keyframes ${this.uniqueId}-slideIn {
            0% {
              opacity: 0;
              transform: translateY(30px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes ${this.uniqueId}-slideOut {
            0% {
              opacity: 1;
              transform: translateY(0);
            }
            100% {
              opacity: 0;
              transform: translateY(30px);
            }
          }

          .${this.uniqueId}-btn {
            position: fixed;
            bottom: 80px;
            right: 20px;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            cursor: pointer;
            z-index: 999;
            font-size: 20px;
            font-weight: bold;
            display: none;
            align-items: center;
            justify-content: center;
            outline: none;
            opacity: 0.9;
            transition: all 0.2s ease;
            -webkit-tap-highlight-color: transparent;
            
            /* Light theme (Twitter style) */
            background-color: #ffffff;
            color: #1d9bf0;
            border: 1px solid rgba(0, 0, 0, 0.08);
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }

          /* Dark theme (Twitter style) */
          .dark-mode .${this.uniqueId}-btn,
          [data-theme="dark"] .${this.uniqueId}-btn,
          html[data-theme="dark"] .${this.uniqueId}-btn,
          body.dark-mode .${this.uniqueId}-btn,
          .dark-theme .${this.uniqueId}-btn,
          html.dark .${this.uniqueId}-btn,
          [data-color-mode="dark"] .${this.uniqueId}-btn {
            background-color: #15202b;
            color: #1d9bf0;
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
          }

          /* Dim theme (Twitter style) */
          html.dim .${this.uniqueId}-btn,
          [data-color-mode="dim"] .${this.uniqueId}-btn,
          [data-theme="dim"] .${this.uniqueId}-btn {
            background-color: #1e2732;
            color: #1d9bf0;
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          }

          /* Support for prefers-color-scheme */
          @media (prefers-color-scheme: dark) {
            .${this.uniqueId}-btn:not(.light-theme-override) {
              background-color: #15202b;
              color: #1d9bf0;
              border: 1px solid rgba(255, 255, 255, 0.08);
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
            }
          }
          
          .${this.uniqueId}-btn.${this.uniqueId}-visible {
            display: flex;
            animation: ${this.uniqueId}-slideIn 0.3s ease forwards;
          }
          
          .${this.uniqueId}-btn.${this.uniqueId}-hidden {
            animation: ${this.uniqueId}-slideOut 0.3s ease forwards;
            display: flex;
          }
          
          .${this.uniqueId}-btn:hover {
            opacity: 1;
            background-color: #1d9bf0;
            color: #ffffff;
            transform: scale(1.05);
          }
          
          .${this.uniqueId}-btn:active {
            transform: scale(0.95);
          }

          @media (prefers-reduced-motion: reduce) {
            .${this.uniqueId}-btn {
              animation: none !important;
              transition: none !important;
            }
          }
        `;
        return style;
      },
      
      init() {
        // Check if script already running to avoid conflicts
        if (window[`${this.uniqueId}-initialized`]) {
          console.warn('Scroll manager already initialized');
          return () => {};
        }
        
        window[`${this.uniqueId}-initialized`] = true;
        
        // Create and append elements
        const button = this.createButton();
        const styles = this.createStyles();
        
        document.head.appendChild(styles);
        document.body.appendChild(button);
        
        // Get chat container
        const chatContainer = this.findChatContainer();
        if (chatContainer) {
          this.setupScrollListener(chatContainer, button);
        } else {
          console.warn('Could not find any suitable chat container');
          // Set up a mutation observer to look for the container when it appears
          this.setupMutationObserver(button);
        }
        
        // Check for theme
        this.detectTheme();
        
        // Watch for theme changes
        this.setupThemeWatcher();
        
        // Cleanup function
        return () => {
          window[`${this.uniqueId}-initialized`] = false;
          button.remove();
          styles.remove();
        };
      },
      
      findChatContainer() {
        // Try to find chat container using multiple possible selectors
        const possibleContainers = [
          document.getElementById('chatContainer'),
          document.querySelector('.chat-container'),
          document.querySelector('.messages-container'),
          document.querySelector('.conversation-container'),
          document.querySelector('[role="log"]'),
          document.querySelector('.overflow-y-auto'),
          document.querySelector('.chat-wrapper'),
          document.querySelector('main'),
          // Twitter-specific containers
          document.querySelector('.timeline'),
          document.querySelector('[data-testid="primaryColumn"]')
        ];
        
        return possibleContainers.find(container => container);
      },
      
      setupMutationObserver(button) {
        const observer = new MutationObserver(() => {
          const chatContainer = this.findChatContainer();
          if (chatContainer) {
            this.setupScrollListener(chatContainer, button);
            observer.disconnect();
          }
        });
        
        observer.observe(document.body, { 
          childList: true, 
          subtree: true 
        });
        
        // Disconnect after 10 seconds to prevent memory leaks
        setTimeout(() => observer.disconnect(), 10000);
      },
      
      setupScrollListener(container, button) {
        // Throttle scroll handler for performance
        let scrollTimeout;
        const throttledCheckScroll = () => {
          if (!scrollTimeout) {
            scrollTimeout = setTimeout(() => {
              this.checkScrollPosition(container, button);
              scrollTimeout = null;
            }, 100);
          }
        };
        
        // Event listeners
        container.addEventListener('scroll', throttledCheckScroll, { passive: true });
        window.addEventListener('resize', throttledCheckScroll, { passive: true });
        
        button.addEventListener('click', () => {
          this.scrollToBottom(container);
        });
        
        // Initial check
        setTimeout(() => {
          this.checkScrollPosition(container, button);
        }, 300);
      },
      
      detectTheme() {
        // Function to check theme
        const checkTheme = () => {
          // Check for Twitter specific theme classes and data attributes
          const twitterThemes = [
            { selector: 'html', attr: 'data-theme', value: 'dark' },
            { selector: 'html', attr: 'data-color-mode', value: 'dark' },
            { selector: 'html', className: 'dark' },
            { selector: 'html', className: 'dim' },
            { selector: 'body', attr: 'data-twitter-theme', value: 'dark' },
            { selector: 'body', attr: 'data-twitter-theme', value: 'dim' }
          ];
          
          for (const theme of twitterThemes) {
            const element = document.querySelector(theme.selector);
            if (element) {
              if (theme.attr && element.getAttribute(theme.attr) === theme.value) {
                return theme.value;
              }
              if (theme.className && element.classList.contains(theme.className)) {
                return theme.className;
              }
            }
          }
          
          // Check for common theme values in local storage
          try {
            const themeKeys = [
              'theme', 
              'darkMode', 
              'colorScheme',
              'appearance',
              'site-theme',
              'color-mode',
              'ui-theme',
              'twitter:theme'
            ];
            
            for (const key of themeKeys) {
              const value = localStorage.getItem(key);
              if (value) {
                if (value.includes('dark') || value === 'dim') {
                  return value;
                }
                if (value === 'true' && key.toLowerCase().includes('dark')) {
                  return 'dark';
                }
              }
            }
          } catch (e) {
            console.warn('Error accessing localStorage:', e);
          }
          
          // Check media query as fallback
          if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
          }
          
          return 'light';
        };
        
        // Apply appropriate theme class
        const themeValue = checkTheme();
        if (themeValue === 'dark' || themeValue === 'dim') {
          document.documentElement.classList.add('dark-theme');
          if (themeValue === 'dim') {
            document.documentElement.classList.add('dim');
          }
        }
      },
      
      setupThemeWatcher() {
        // Watch for attribute or class changes on html and body elements
        const observeElement = (element) => {
          const observer = new MutationObserver(() => {
            this.detectTheme();
          });
          
          observer.observe(element, { 
            attributes: true,
            attributeFilter: ['class', 'data-theme', 'data-color-mode', 'data-twitter-theme']
          });
        };
        
        observeElement(document.documentElement);
        observeElement(document.body);
        
        // Also listen for localStorage changes
        window.addEventListener('storage', (e) => {
          if (e.key && (
              e.key.toLowerCase().includes('theme') || 
              e.key.toLowerCase().includes('mode') || 
              e.key.toLowerCase().includes('color') ||
              e.key.toLowerCase().includes('appearance'))) {
            this.detectTheme();
          }
        });
        
        // Watch for system preference changes
        if (window.matchMedia) {
          window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            this.detectTheme();
          });
        }
      },
      
      checkScrollPosition(container, button) {
        if (!container) return;
        
        const distanceFromBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight;
        
        if (distanceFromBottom > 150) {
          if (!button.classList.contains(`${this.uniqueId}-visible`)) {
            button.classList.add(`${this.uniqueId}-visible`);
            button.classList.remove(`${this.uniqueId}-hidden`);
          }
        } else {
          if (button.classList.contains(`${this.uniqueId}-visible`)) {
            button.classList.add(`${this.uniqueId}-hidden`);
            button.classList.remove(`${this.uniqueId}-visible`);
          }
        }
      },
      
      scrollToBottom(container) {
        if (!container) return;
        
        container.scrollTo({
          top: container.scrollHeight,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
        });
      }
    };
    
    // Initialize and store cleanup function
    const cleanup = scrollManager.init();
    
    // Clean up on page unload if needed
    window.addEventListener('unload', cleanup);
  });
})();
