(function() {
  // Use a unique namespace to avoid conflicts
  if (window.ChatEnhancer) return;
  
  // Create a robust namespace
  window.ChatEnhancer = {
    // Unique identifier to prevent conflicts
    namespace: `chat-enhancer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    
    // Configuration object
    config: {
      replyIconSVG: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
        </svg>
      `,
      mentionStyle: {
        backgroundColor: '#1da1f2',
        color: 'white',
        borderRadius: '4px',
        padding: '2px 6px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        fontSize: '0.8em',
        letterSpacing: '0.5px',
        border: '1px solid rgba(255,255,255,0.3)',
        boxShadow: '0 2px 5px rgba(29, 161, 242, 0.3)'
      }
    },
    
    // Initialize styles with minimal and specific selectors
    initStyles() {
      const styleElement = document.createElement('style');
      styleElement.setAttribute('data-enhancer-styles', this.namespace);
      
      // Create a style object from config for easier application
      const mentionStyle = this.config.mentionStyle;
      const mentionStyleString = Object.entries(mentionStyle)
        .map(([key, value]) => `${key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}: ${value};`)
        .join(' ');
      
      styleElement.textContent = `
        /* Scoped styles using namespace */
        [data-enhancer-reply-btn="${this.namespace}"] {
          display: inline-flex;
          align-items: center;
          background: none;
          border: none;
          cursor: pointer;
          color: #8899a6;
          transition: all 0.2s ease;
          padding: 4px 8px;
          margin-right: 8px;
          border-radius: 4px;
          font-size: 14px;
        }
        
        [data-enhancer-reply-btn="${this.namespace}"]:hover {
          background-color: rgba(29, 161, 242, 0.1);
          color: #1da1f2;
        }
        
        [data-enhancer-reply-btn="${this.namespace}"] svg {
          margin-right: 6px;
        }
        
        [data-enhancer-mention="${this.namespace}"] {
          ${mentionStyleString}
          display: inline-block;
          margin: 0 2px;
          vertical-align: baseline;
          line-height: 1.4;
          animation: ${this.namespace}-mention-glow 1.5s infinite alternate;
        }

        @keyframes ${this.namespace}-mention-glow {
          from { 
            transform: scale(1);
            box-shadow: 0 0 5px rgba(29, 161, 242, 0.5);
          }
          to { 
            transform: scale(1.05);
            box-shadow: 0 0 10px rgba(29, 161, 242, 0.8);
          }
        }
      `;
      document.head.appendChild(styleElement);
    },
    
    // Enhanced mention highlighting
    highlightMentions(text) {
      // Improved regex to catch mentions more accurately
      return text.replace(/(@\w+;)/g, (match) =>
        `<span data-enhancer-mention="${this.namespace}" title="Direct mention">${match}</span>`
      );
    },
    
    // Add reply functionality to a specific message
    addReplyToMessage(messageElement) {
      // Prevent duplicate processing
      if (messageElement.getAttribute('data-reply-processed') === this.namespace) return;
      
      // Get username (adjust selector as needed)
      const userNameElement = messageElement.querySelector('.user-name');
      if (!userNameElement) return;
      
      const userName = userNameElement.textContent.trim();
      
      // Create reply button
      const replyBtn = document.createElement('button');
      replyBtn.setAttribute('data-enhancer-reply-btn', this.namespace);
      replyBtn.innerHTML = `
        ${this.config.replyIconSVG}
        Reply
      `;
      
      // Reply click handler
      replyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const messageInput = document.getElementById('messageInput');
        if (!messageInput) return;
        
        // Prepend username mention
        messageInput.value = `@${userName}; ${messageInput.value}`;
        messageInput.focus();
        
        // Trigger input event
        const event = new Event('input', { bubbles: true });
        messageInput.dispatchEvent(event);
      });
      
      // Find and replace action buttons
      const actionButtonsContainer = messageElement.querySelector('.action-buttons');
      if (actionButtonsContainer) {
        actionButtonsContainer.innerHTML = '';
        actionButtonsContainer.appendChild(replyBtn);
      }
      
      // Mark as processed
      messageElement.setAttribute('data-reply-processed', this.namespace);
    },
    
    // Process messages with minimal intervention
    processMessages() {
      const chatContainer = document.getElementById('chatContainer');
      if (!chatContainer) return;
      
      // Process existing messages
      const messages = chatContainer.querySelectorAll('.message');
      messages.forEach(message => {
        this.addReplyToMessage(message);
        
        // Highlight mentions
        const messageText = message.querySelector('.message-text');
        if (messageText && messageText.textContent.includes('@')) {
          messageText.innerHTML = this.highlightMentions(messageText.textContent);
        }
      });
      
      // Set up mutation observer
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE &&
                node.classList.contains('message')) {
                this.addReplyToMessage(node);
                
                // Highlight mentions
                const messageText = node.querySelector('.message-text');
                if (messageText && messageText.textContent.includes('@')) {
                  messageText.innerHTML = this.highlightMentions(messageText.textContent);
                }
              }
            });
          }
        });
      });
      
      // Observe chat container
      observer.observe(chatContainer, {
        childList: true,
        subtree: true
      });
    },
    
    // Initialize enhancer
    init() {
      // Ensure DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
    },
    
    // Setup method to initialize everything
    setup() {
      this.initStyles();
      this.processMessages();
      
      // Fallback processing after a short delay
      setTimeout(() => this.processMessages(), 1000);
    }
  };
  
  // Initialize the enhancer
  window.ChatEnhancer.init();
})();