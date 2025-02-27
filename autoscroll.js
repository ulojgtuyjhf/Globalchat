(() => {
  document.addEventListener('DOMContentLoaded', () => {
    // Create unique namespace to avoid conflicts
    const scrollManager = {
      uniqueId: `scroll-${Math.random().toString(36).substr(2, 9)}`,
      
      createButton() {
        const button = document.createElement('button');
        button.innerHTML = '↓'; // You can replace this with an SVG icon for better customization
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
            bottom: 100px; /* Updated: Moved the button a little bit higher */
            right: 20px;
            width: 40px; /* Slightly smaller */
            height: 40px; /* Slightly smaller */
            background: #ffffff; /* White background */
            color: #1da1f2; /* Twitter blue */
            border: 2px solid rgba(29, 161, 242, 0.2); /* Twitter blue with transparency */
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 
              0 4px 6px rgba(0,0,0,0.2),
              0 1px 3px rgba(0,0,0,0.15);
            z-index: 1000;
            font-size: 20px; /* Slightly smaller font size */
            font-weight: bold;
            display: none;
            align-items: center;
            justify-content: center;
            outline: none;
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            -webkit-tap-highlight-color: transparent;
          }
          
          .${this.uniqueId}-btn.${this.uniqueId}-visible {
            display: flex;
            animation: 
              ${this.uniqueId}-slideIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards,
              ${this.uniqueId}-shimmer 2s infinite linear;
          }
          
          .${this.uniqueId}-btn.${this.uniqueId}-hidden {
            animation: ${this.uniqueId}-slideOut 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            display: flex; /* Keep it visible during animation */
          }
          
          .${this.uniqueId}-btn:hover {
            transform: scale(1.1);
            background-color: #1da1f2; /* Twitter blue on hover */
            color: #fff; /* White text on hover */
            border-color: #1da1f2; /* Twitter blue on hover */
            box-shadow: 
              0 6px 8px rgba(29, 161, 242, 0.25),
              0 2px 4px rgba(29, 161, 242, 0.2);
          }
          
          .${this.uniqueId}-btn:active {
            transform: scale(0.95);
            box-shadow: 
              0 2px 4px rgba(29, 161, 242, 0.2);
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
            button.classList.remove(`${this.uniqueId}-hidden`);
          }
        } else {
          if (!button.classList.contains(`${this.uniqueId}-hidden`)) {
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