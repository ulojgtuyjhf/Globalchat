(() => { // IIFE for scope isolation
  document.addEventListener('DOMContentLoaded', () => {
    // Create unique namespace to avoid conflicts
    const scrollManager = {
      uniqueId: `scroll-${Math.random().toString(36).substr(2, 9)}`,
      
      createButton() {
        const button = document.createElement('button');
        button.innerHTML = '↓';
        button.id = this.uniqueId;
        button.classList.add(`${this.uniqueId}-btn`);
        return button;
      },
      
      createStyles() {
        const style = document.createElement('style');
        style.textContent = `
          @keyframes ${this.uniqueId}-shimmer {
            0% {
              background-position: -200% 50%;
            }
            100% {
              background-position: 200% 50%;
            }
          }

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

          .${this.uniqueId}-btn {
            position: fixed;
            bottom: 100px; /* Updated: Moved the button a little bit higher */
            right: 20px;
            width: 45px;
            height: 45px;
            background: white;
            color: black;
            border: 2px solid rgba(0,0,0,0.1);
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 
              0 4px 6px rgba(0,0,0,0.1),
              0 1px 3px rgba(0,0,0,0.08);
            z-index: 1000;
            font-size: 24px;
            font-weight: bold;
            display: none;
            align-items: center;
            justify-content: center;
            outline: none;
            opacity: 0;
            background: linear-gradient(
              120deg,
              #ffffff 0%,
              #ffffff 30%,
              rgba(255, 255, 255, 0.8) 50%,
              #ffffff 70%,
              #ffffff 100%
            );
            background-size: 400% 100%;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            -webkit-tap-highlight-color: transparent;
          }
          
          .${this.uniqueId}-btn.${this.uniqueId}-visible {
            display: flex;
            animation: 
              ${this.uniqueId}-slideIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards,
              ${this.uniqueId}-shimmer 2s infinite linear;
          }
          
          .${this.uniqueId}-btn:hover {
            transform: scale(1.1);
            box-shadow: 
              0 6px 8px rgba(0,0,0,0.15),
              0 2px 4px rgba(0,0,0,0.12);
          }
          
          .${this.uniqueId}-btn:active {
            transform: scale(0.95);
            box-shadow: 
              0 2px 4px rgba(0,0,0,0.1);
          }

          @media (prefers-reduced-motion: reduce) {
            .${this.uniqueId}-btn {
              animation: none;
              transition: none;
            }
          }
        `;
        return style;
      },
      
      init() {
        // Create and append elements
        const button = this.createButton();
        const styles = this.createStyles();
        
        document.head.appendChild(styles);
        document.body.appendChild(button);
        
        // Get chat container
        const chatContainer = document.getElementById('chatContainer');
        if (!chatContainer) {
          console.warn('Chat container not found');
          return;
        }
        
        // Throttle scroll handler for performance
        let scrollTimeout;
        const throttledCheckScroll = () => {
          if (!scrollTimeout) {
            scrollTimeout = setTimeout(() => {
              this.checkScrollPosition(chatContainer, button);
              scrollTimeout = null;
            }, 100);
          }
        };
        
        // Event listeners
        chatContainer.addEventListener('scroll', throttledCheckScroll, { passive: true });
        window.addEventListener('resize', throttledCheckScroll, { passive: true });
        
        button.addEventListener('click', () => {
          this.scrollToBottom(chatContainer);
        });
        
        // Initial check
        this.checkScrollPosition(chatContainer, button);
        
        // Cleanup function
        return () => {
          chatContainer.removeEventListener('scroll', throttledCheckScroll);
          window.removeEventListener('resize', throttledCheckScroll);
          button.remove();
          styles.remove();
        };
      },
      
      checkScrollPosition(container, button) {
        if (!container) return;
        
        const distanceFromBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight;
        
        if (distanceFromBottom > 200) {
          if (!button.classList.contains(`${this.uniqueId}-visible`)) {
            button.classList.add(`${this.uniqueId}-visible`);
          }
        } else {
          button.classList.remove(`${this.uniqueId}-visible`);
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