(() => { // Wrap in IIFE to avoid global scope pollution
  document.addEventListener('DOMContentLoaded', () => {
    // Create unique namespace for this script
    const messageHighlighter = {
      // Add highlight styles with enhanced shimmer effect
      initStyles() {
        const style = document.createElement('style');
        const uniquePrefix = `mh-${Math.random().toString(36).substr(2, 9)}`;
        style.textContent = `
          .${uniquePrefix}-reply {
            position: relative;
            overflow: hidden;
          }

          .${uniquePrefix}-reply::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            width: 4px;
            height: 100%;
            background: linear-gradient(to bottom, 
              ${this.getRandomColor()}, 
              ${this.getRandomColor()});
            animation: ${uniquePrefix}-slideIn 0.3s ease-out;
          }

          .${uniquePrefix}-reply::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.05);
            animation: ${uniquePrefix}-fadeOut 2s forwards;
          }

          .${uniquePrefix}-mention {
            position: relative;
            font-weight: bold;
            padding: 0 4px;
            border-radius: 3px;
            animation: ${uniquePrefix}-shimmer 2s infinite linear;
          }

          @keyframes ${uniquePrefix}-shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }

          @keyframes ${uniquePrefix}-slideIn {
            from { transform: translateX(-100%); }
            to { transform: translateX(0); }
          }

          @keyframes ${uniquePrefix}-fadeOut {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 0; }
          }
        `;
        document.head.appendChild(style);
        return uniquePrefix;
      },

      // Enhanced random color generation with more vibrant options
      getRandomColor() {
        const hue = Math.floor(Math.random() * 360);
        const saturation = Math.floor(Math.random() * (95 - 70) + 70);
        const lightness = Math.floor(Math.random() * (80 - 60) + 60);
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      },

      // Generate gradient with multiple color stops
      generateGradient() {
        const colors = [
          this.getRandomColor(),
          this.getRandomColor(),
          this.getRandomColor()
        ];
        return `linear-gradient(90deg, 
          ${colors[0]} 20%, 
          ${colors[1]} 50%, 
          ${colors[2]} 80%)`;
      },

      // Enhanced username mention highlighting
      highlightUsernameMention(text, prefix) {
        return text.replace(/(@\w+)/g, (match) => {
          const gradient = this.generateGradient();
          return `<span class="${prefix}-mention" 
            style="background: ${gradient}; 
            background-size: 200% 100%; 
            color: #000000; 
            text-shadow: 0 1px 1px rgba(255,255,255,0.7);">
            ${match}
          </span>`;
        });
      },

      // Initialize the highlighter
      init() {
        const prefix = this.initStyles();
        const chatContainer = document.getElementById('chatContainer');
        
        if (!chatContainer) {
          console.warn('Chat container not found');
          return;
        }

        // Watch for new messages
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.classList?.contains('message')) {
                const messageContent = node.querySelector('.message-content p');
                if (messageContent && messageContent.textContent.includes('@')) {
                  node.classList.add(`${prefix}-reply`);
                  messageContent.innerHTML = this.highlightUsernameMention(
                    messageContent.textContent,
                    prefix
                  );
                }
              }
            });
          });
        });

        observer.observe(chatContainer, { 
          childList: true,
          subtree: true 
        });

        // Handle existing messages
        document.querySelectorAll('.message .message-content p').forEach(content => {
          const text = content.textContent;
          if (text.includes('@')) {
            content.closest('.message').classList.add(`${prefix}-reply`);
            content.innerHTML = this.highlightUsernameMention(text, prefix);
          }
        });
      }
    };

    // Initialize the highlighter
    messageHighlighter.init();
  });
})();