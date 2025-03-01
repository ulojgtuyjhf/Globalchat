
(() => {
  // Wait for DOM to be fully loaded
  document.addEventListener('DOMContentLoaded', () => {
    // Create a namespace to avoid conflicts
    const chatEnhancer = {
      // Generate a unique prefix for CSS classes to avoid conflicts
      prefix: `chat-${Math.random().toString(36).substr(2, 9)}`,
      
      // Initialize styles for both reply and highlighting features
      initStyles() {
        const style = document.createElement('style');
        style.textContent = `
          /* Hide original reply button */
          .reply-btn {
            display: none !important;
          }
          
          /* New WhatsApp-style reply button */
          .${this.prefix}-reply-btn {
            display: flex;
            align-items: center;
            margin-right: 24px;
            color: #8899a6;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 14px;
            transition: color 0.2s;
          }
          
          .${this.prefix}-reply-btn:hover {
            color: #1da1f2;
          }
          
          .${this.prefix}-reply-btn svg {
            width: 18px;
            height: 18px;
            margin-right: 8px;
            fill: currentColor;
          }
          
          /* Highlighted message styles */
          .${this.prefix}-highlighted {
            position: relative;
            overflow: hidden;
          }

          .${this.prefix}-highlighted::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            width: 4px;
            height: 100%;
            background: linear-gradient(to bottom, 
              ${this.getRandomColor()}, 
              ${this.getRandomColor()});
            animation: ${this.prefix}-slideIn 0.3s ease-out;
          }

          .${this.prefix}-highlighted::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(29, 161, 242, 0.05);
            animation: ${this.prefix}-fadeOut 2s forwards;
          }

          .${this.prefix}-mention {
            position: relative;
            font-weight: bold;
            padding: 0 4px;
            border-radius: 3px;
            animation: ${this.prefix}-shimmer 2s infinite linear;
          }

          @keyframes ${this.prefix}-shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }

          @keyframes ${this.prefix}-slideIn {
            from { transform: translateX(-100%); }
            to { transform: translateX(0); }
          }

          @keyframes ${this.prefix}-fadeOut {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 0; }
          }
        `;
        document.head.appendChild(style);
      },
      
      // Generate random vibrant color
      getRandomColor() {
        const hue = Math.floor(Math.random() * 360);
        const saturation = Math.floor(Math.random() * (95 - 70) + 70);
        const lightness = Math.floor(Math.random() * (80 - 60) + 60);
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      },
      
      // Generate multi-color gradient
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
      
      // Highlight username mentions in text
      highlightMentions(text) {
        return text.replace(/(@\w+;)/g, (match) => {
          const gradient = this.generateGradient();
          return `<span class="${this.prefix}-mention" 
            style="background: ${gradient}; 
            background-size: 200% 100%; 
            color: #000000; 
            text-shadow: 0 1px 1px rgba(255,255,255,0.7);">
            ${match}
          </span>`;
        });
      },
      
      // Add reply functionality to a message
      addReplyToMessage(messageElement) {
        // Check if already processed
        if (messageElement.querySelector(`.${this.prefix}-reply-btn`)) return;
        
        // Get the username
        const userName = messageElement.querySelector('.user-name')?.textContent || 'User';
        
        // Create Twitter/WhatsApp-style reply button
        const replyBtn = document.createElement('button');
        replyBtn.className = `${this.prefix}-reply-btn action-button`;
        replyBtn.innerHTML = `
          <svg viewBox="0 0 24 24">
            <path d="M14.046 2.242l-4.148-.01h-.002c-4.374 0-7.8 3.427-7.8 7.802 0 4.098 3.186 7.206 7.465 7.37v3.828a.85.85 0 0 0 .12.403.744.744 0 0 0 1.034.229c.264-.168 6.473-4.14 8.088-5.506 1.902-1.61 3.04-3.97 3.043-6.312v-.017c-.006-4.367-3.43-7.787-7.8-7.788z"></path>
          </svg>
          Reply
        `;
        
        // Add click handler
        replyBtn.addEventListener('click', () => {
          const messageInput = document.getElementById('messageInput');
          messageInput.value = `@${userName}; ${messageInput.value}`;
          messageInput.focus();
          
          // Trigger input event to enable send button
          const event = new Event('input', { bubbles: true });
          messageInput.dispatchEvent(event);
        });
        
        // Replace original buttons with new one
        const actionButtons = messageElement.querySelector('.action-buttons');
        if (actionButtons) {
          actionButtons.innerHTML = '';
          actionButtons.appendChild(replyBtn);
        }
      },
      
      // Process new and existing messages
      processMessages() {
        // Set up observer for new messages
        const chatContainer = document.getElementById('chatContainer');
        if (!chatContainer) {
          console.warn('Chat container not found');
          return;
        }
        
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
              mutation.addedNodes.forEach((node) => {
                if (node.classList && node.classList.contains('message')) {
                  // Add reply button
                  this.addReplyToMessage(node);
                  
                  // Check for mentions to highlight
                  const messageText = node.querySelector('.message-text');
                  if (messageText && messageText.textContent.includes('@')) {
                    node.classList.add(`${this.prefix}-highlighted`);
                    messageText.innerHTML = this.highlightMentions(messageText.textContent);
                  }
                }
              });
            }
          });
        });
        
        observer.observe(chatContainer, { 
          childList: true,
          subtree: true 
        });
        
        // Process existing messages
        document.querySelectorAll('.message').forEach(message => {
          this.addReplyToMessage(message);
          
          const messageText = message.querySelector('.message-text');
          if (messageText && messageText.textContent.includes('@')) {
            message.classList.add(`${this.prefix}-highlighted`);
            messageText.innerHTML = this.highlightMentions(messageText.textContent);
          }
        });
      },
      
      // Track changes in input field to highlight mentions as you type
      setupInputTracking() {
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
          messageInput.addEventListener('input', () => {
            // If this interferes with other code, remove this section
            // This is just for potential real-time highlighting while typing
            if (messageInput.value.includes('@')) {
              // Future enhancement: Could add real-time highlighting
            }
          });
        }
      },
      
      // Initialize everything
      init() {
        this.initStyles();
        this.processMessages();
        this.setupInputTracking();
        
        // Check again after a delay to ensure we catch elements added by other scripts
        setTimeout(() => this.processMessages(), 1000);
      }
    };
    
    // Start enhancer
    chatEnhancer.init();
  });
})();

