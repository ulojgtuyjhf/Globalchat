
(function() {
  if (window.TwitterReplySystem) return;
  
  window.TwitterReplySystem = {
    replyingTo: null,
    currentTheme: 'light',
    
    icons: {
      // True reply arrow icon (not a comment bubble)
      reply: `<svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 3.786c-4.556 0-8.25 3.694-8.25 8.25s3.694 8.25 8.25 8.25c1.595 0 3.081-.451 4.341-1.233l1.054 1.1c-1.545.945-3.353 1.488-5.28 1.488-5.636 0-10.201-4.565-10.201-10.201S6.764 1.08 12.4 1.08c5.636 0 10.201 4.565 10.201 10.201v1.16c0 1.644-1.336 2.98-2.98 2.98-1.644 0-2.98-1.336-2.98-2.98V9.09h-1.586c-1.05-1.635-2.905-2.724-5.02-2.724-3.276 0-5.931 2.655-5.931 5.931s2.655 5.931 5.931 5.931c1.94 0 3.666-.932 4.744-2.373h1.043c.903 1.612 2.623 2.706 4.598 2.706 2.904 0 5.26-2.356 5.26-5.26V12c0-4.556-3.694-8.25-8.25-8.25zm0 14.034c-3.194 0-5.784-2.59-5.784-5.784s2.59-5.784 5.784-5.784 5.784 2.59 5.784 5.784-2.59 5.784-5.784 5.784z"></path></svg>`,
      
      // Better reply arrow (cleaner, more like Twitter's actual reply arrow)
      reply: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
        </svg>`,
      
      // ACTUAL Twitter reply arrow (simplified)
      reply: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
        </svg>`,
      
      close: `<svg viewBox="0 0 24 24" width="14" height="14"><path d="M10.59 12L4.54 5.96l1.42-1.42L12 10.59l6.04-6.05 1.42 1.42L13.41 12l6.05 6.04-1.42 1.42L12 13.41l-6.04 6.05-1.42-1.42L10.59 12z"></path></svg>`
    },
    
    initStyles() {
      // Remove old styles if they exist
      const oldStyle = document.getElementById('twitter-reply-styles');
      if (oldStyle) oldStyle.remove();
      
      const style = document.createElement('style');
      style.id = 'twitter-reply-styles';
      style.textContent = `
        /* Theme-aware styles - independent of color palette */
        .twitter-reply-btn {
          opacity: 0.7;
          cursor: pointer;
          background: none;
          border: none;
          padding: 5px;
          transition: all 0.15s ease;
          display: inline-flex;
          margin-right: 8px;
          border-radius: 50%;
        }
        
        .twitter-reply-btn:hover {
          opacity: 1;
          background-color: var(--hover);
        }
        
        /* Theme-specific fill colors for the icons */
        [data-theme="light"] .twitter-reply-btn svg {
          fill: #536471;
        }
        
        [data-theme="light"] .twitter-reply-btn:hover svg {
          fill: #1d9bf0;
        }
        
        [data-theme="dim"] .twitter-reply-btn svg {
          fill: #8899a6;
        }
        
        [data-theme="dim"] .twitter-reply-btn:hover svg {
          fill: #1d9bf0;
        }
        
        [data-theme="dark"] .twitter-reply-btn svg {
          fill: #71767b;
        }
        
        [data-theme="dark"] .twitter-reply-btn:hover svg {
          fill: #1d9bf0;
        }
        
        /* Reply quote with theme awareness */
        .twitter-reply-quote {
          display: none;
          margin: 0 0 8px 0;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-left: 3px solid var(--primary);
          border-radius: 0 8px 8px 0;
          padding: 8px 10px;
          position: relative;
          max-width: 100%;
          animation: slide-in 0.2s ease;
          font-size: 13px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }
        
        .twitter-reply-quote.active {
          display: block;
        }
        
        @keyframes slide-in {
          from { transform: translateY(-8px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .twitter-reply-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3px;
        }
        
        .twitter-reply-name {
          font-weight: 600;
          color: var(--primary);
          font-size: 12px;
        }
        
        .twitter-reply-text {
          color: var(--secondary-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 12px;
          line-height: 1.4;
        }
        
        .twitter-reply-close {
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          padding: 3px;
          border-radius: 50%;
          margin-left: 4px;
          transition: all 0.15s ease;
        }
        
        .twitter-reply-close svg {
          fill: var(--secondary-text);
        }
        
        .twitter-reply-close:hover {
          background: var(--hover);
        }
        
        .twitter-reply-close:hover svg {
          fill: var(--primary);
        }
        
        /* Theme-aware reply indicator */
        .twitter-reply-indicator {
          margin-bottom: 6px;
          padding: 5px 8px;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-left: 3px solid var(--primary);
          border-radius: 0 6px 6px 0;
          font-size: 12px;
          color: var(--secondary-text);
          max-width: 90%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }
        
        .reply-username {
          color: var(--primary);
          font-weight: 600;
        }
      `;
      document.head.appendChild(style);
    },
    
    createReplyQuote() {
      const container = document.querySelector('.twitter-reply-quote');
      if (container) return container;
      
      const quoteContainer = document.createElement('div');
      quoteContainer.className = 'twitter-reply-quote';
      
      // Find the input container
      const inputContainer = document.querySelector('.input-container, .message-input-wrapper, #inputArea');
      if (inputContainer) {
        inputContainer.insertBefore(quoteContainer, inputContainer.firstChild);
      }
      
      return quoteContainer;
    },
    
    showReplyQuote(messageElement) {
      // Get message details
      const userName = messageElement.querySelector('.user-name')?.textContent.trim() || 'User';
      const messageText = messageElement.querySelector('.message-text')?.textContent.trim() || '';
      const messageId = messageElement.id || messageElement.dataset.messageId || `msg-${Date.now()}`;
      
      // Save what we're replying to
      this.replyingTo = {
        id: messageId,
        userName: userName,
        text: messageText
      };
      
      // Get or create the quote container
      const quoteContainer = this.createReplyQuote();
      
      // Set content
      quoteContainer.innerHTML = `
        <div class="twitter-reply-header">
          <div class="twitter-reply-name">Replying to @${userName}</div>
          <button class="twitter-reply-close">${this.icons.close}</button>
        </div>
        <div class="twitter-reply-text">${messageText}</div>
      `;
      
      // Add close button functionality
      quoteContainer.querySelector('.twitter-reply-close').addEventListener('click', () => {
        this.cancelReply();
      });
      
      // Show it
      quoteContainer.classList.add('active');
      
      // Focus the input
      const input = document.querySelector('#messageInput');
      if (input) input.focus();
    },
    
    cancelReply() {
      const quoteContainer = document.querySelector('.twitter-reply-quote');
      if (quoteContainer) {
        quoteContainer.classList.remove('active');
      }
      this.replyingTo = null;
    },
    
    enhanceSendButton() {
      const sendBtn = document.querySelector('#sendButton, .send-button');
      if (!sendBtn) return;
      
      // Save original click handler
      const originalClick = sendBtn.onclick;
      
      // Replace with our handler
      sendBtn.onclick = (e) => {
        const input = document.querySelector('#messageInput');
        
        // If replying to someone
        if (this.replyingTo && input) {
          // Add special format that can be detected to identify this as a reply
          const replyMeta = `___REPLY:${this.replyingTo.id}___`;
          
          // Only add if not already present
          if (!input.value.includes(replyMeta)) {
            // Add at beginning for easier detection
            input.value = `${replyMeta} ${input.value}`;
          }
          
          // Clear the reply quote after sending
          setTimeout(() => this.cancelReply(), 10);
        }
        
        // Call original handler
        if (typeof originalClick === 'function') {
          originalClick.call(sendBtn, e);
        }
      };
    },
    
    processMessages() {
      // Get all messages
      const messages = document.querySelectorAll('.message');
      messages.forEach(msg => {
        // Check if we already processed this message
        if (msg.getAttribute('data-reply-added')) return;
        
        // Find the actions area - keeping original position but moved to left
        const actionArea = msg.querySelector('.message-actions, .action-buttons');
        if (actionArea) {
          // Create reply button
          const replyBtn = document.createElement('button');
          replyBtn.className = 'twitter-reply-btn';
          replyBtn.innerHTML = this.icons.reply;
          replyBtn.title = 'Reply';
          
          // Add at LEFT SIDE as requested
          actionArea.insertBefore(replyBtn, actionArea.firstChild);
          
          // Add click handler
          replyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showReplyQuote(msg);
          });
          
          // Mark as processed
          msg.setAttribute('data-reply-added', 'true');
        }
        
        // Look for reply metadata in message text
        const messageText = msg.querySelector('.message-text');
        if (messageText && messageText.textContent.includes('___REPLY:')) {
          // Parse the reply ID
          const match = messageText.textContent.match(/___REPLY:([a-zA-Z0-9-_]+)___/);
          if (match && match[1]) {
            const replyToId = match[1];
            
            // Find the replied-to message by ID
            const repliedMsg = document.getElementById(replyToId) || 
                              document.querySelector(`[data-message-id="${replyToId}"]`);
            
            if (repliedMsg) {
              // Get the user name from the replied message
              const userName = repliedMsg.querySelector('.user-name')?.textContent.trim() || 'User';
              const repliedText = repliedMsg.querySelector('.message-text')?.textContent.trim() || '';
              
              // Create compact reply indicator
              const replyIndicator = document.createElement('div');
              replyIndicator.className = 'twitter-reply-indicator';
              replyIndicator.innerHTML = `<span class="reply-username">@${userName}</span>: ${repliedText.length > 60 ? repliedText.substring(0, 60) + '...' : repliedText}`;
              
              // Insert before message text
              if (messageText.parentNode) {
                messageText.parentNode.insertBefore(replyIndicator, messageText);
              }
              
              // Clean up the metadata from display text
              messageText.textContent = messageText.textContent.replace(/___REPLY:[a-zA-Z0-9-_]+___/, '').trim();
            }
          }
        }
      });
    },
    
    observeChat() {
      const chatContainer = document.querySelector('#chatContainer, .chat-messages');
      if (!chatContainer) return;
      
      const observer = new MutationObserver(mutations => {
        let shouldProcess = false;
        
        mutations.forEach(mutation => {
          if (mutation.type === 'childList' && mutation.addedNodes.length) {
            shouldProcess = true;
          }
        });
        
        if (shouldProcess) {
          // Process with small delay to ensure DOM is ready
          setTimeout(() => this.processMessages(), 50);
        }
      });
      
      // Start observing
      observer.observe(chatContainer, {
        childList: true,
        subtree: true
      });
    },
    
    // Listen for theme changes from localStorage
    listenForThemeChanges() {
      // Get current theme
      this.currentTheme = localStorage.getItem('twitter-theme') || 'light';
      
      // Listen for theme changes via storage events
      window.addEventListener('storage', event => {
        if (event.key === 'twitter-theme') {
          this.currentTheme = event.newValue || 'light';
        }
      });
      
      // Listen for custom theme change events
      window.addEventListener('themeChanged', event => {
        if (event.detail && event.detail.theme) {
          this.currentTheme = event.detail.theme;
        }
      });
    },
    
    init() {
      this.listenForThemeChanges();
      this.initStyles();
      this.createReplyQuote();
      this.enhanceSendButton();
      this.processMessages();
      this.observeChat();
      
      // Run again after a delay to catch any missed elements
      setTimeout(() => this.processMessages(), 1000);
      
      console.log('TwitterReplySystem initialized with theme:', this.currentTheme);
    }
  };
  
  // Start the system
  TwitterReplySystem.init();
})();
