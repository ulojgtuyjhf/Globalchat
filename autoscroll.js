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
            bottom: 80px; /* Moved higher to avoid blocking content */
            right: 20px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            z-index: 999; /* Lower z-index to be less intrusive */
            font-size: 18px;
            font-weight: bold;
            display: none;
            align-items: center;
            justify-content: center;
            outline: none;
            opacity: 0.85; /* Slightly transparent */
            transition: all 0.3s ease;
            -webkit-tap-highlight-color: transparent;
            
            /* Light theme default */
            background-color: #ffffff;
            color: #1da1f2;
            border: 2px solid rgba(29, 161, 242, 0.2);
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          }

          /* Dark theme support - will be applied automatically based on detected theme */
          .dark-mode .${this.uniqueId}-btn,
          [data-theme="dark"] .${this.uniqueId}-btn,
          html[data-theme="dark"] .${this.uniqueId}-btn,
          body.dark-mode .${this.uniqueId}-btn,
          .dark-theme .${this.uniqueId}-btn {
            background-color: #222222;
            color: #1da1f2;
            border: 2px solid rgba(29, 161, 242, 0.3);
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          }

          @media (prefers-color-scheme: dark) {
            .${this.uniqueId}-btn {
              background-color: #222222;
              color: #1da1f2;
              border: 2px solid rgba(29, 161, 242, 0.3);
              box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            }
          }
          
          .${this.uniqueId}-btn.${this.uniqueId}-visible {
            display: flex;
            animation: ${this.uniqueId}-slideIn 0.4s ease forwards;
          }
          
          .${this.uniqueId}-btn.${this.uniqueId}-hidden {
            animation: ${this.uniqueId}-slideOut 0.4s ease forwards;
            display: flex;
          }
          
          .${this.uniqueId}-btn:hover {
            opacity: 1;
            background-color: #1da1f2;
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
        const chatContainer = document.getElementById('chatContainer');
        if (!chatContainer) {
          console.warn('Chat container not found, looking for alternatives...');
          // Try to find alternative chat containers
          const possibleContainers = [
            document.querySelector('.chat-container'),
            document.querySelector('.messages-container'),
            document.querySelector('.conversation-container'),
            document.querySelector('[role="log"]'),
            document.querySelector('.overflow-y-auto')
          ];
          
          for (const container of possibleContainers) {
            if (container) {
              this.setupScrollListener(container, button);
              break;
            }
          }
        } else {
          this.setupScrollListener(chatContainer, button);
        }
        
        // Check for theme from local storage
        this.detectThemeFromLocalStorage();
        
        // Cleanup function
        return () => {
          window[`${this.uniqueId}-initialized`] = false;
          button.remove();
          styles.remove();
        };
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
      
      detectThemeFromLocalStorage() {
        // Function to check if theme is dark from local storage
        const checkDarkTheme = () => {
          try {
            // Check various common local storage keys for theme
            const themeKeys = [
              'theme',
              'darkMode',
              'colorScheme',
              'appearance',
              'site-theme',
              'color-mode',
              'ui-theme'
            ];
            
            for (const key of themeKeys) {
              const value = localStorage.getItem(key);
              if (value &&
                (value.includes('dark') ||
                  value === 'night' ||
                  value === 'true' && key.toLowerCase().includes('dark'))) {
                return true;
              }
            }
            
            // No dark theme found in local storage
            return false;
          } catch (e) {
            console.warn('Error accessing localStorage:', e);
            return false;
          }
        };
        
        // If dark theme is detected, add class to document
        if (checkDarkTheme()) {
          document.documentElement.classList.add('dark-theme');
        }
        
        // Listen for storage changes
        window.addEventListener('storage', (e) => {
          if (e.key && (
              e.key.toLowerCase().includes('theme') ||
              e.key.toLowerCase().includes('mode') ||
              e.key.toLowerCase().includes('color') ||
              e.key.toLowerCase().includes('appearance'))) {
            if (checkDarkTheme()) {
              document.documentElement.classList.add('dark-theme');
            } else {
              document.documentElement.classList.remove('dark-theme');
            }
          }
        });
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
