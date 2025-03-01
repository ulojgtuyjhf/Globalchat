// Enhanced WhatsApp-style Reply Feature with Animations
(function() {
  // Variables to track state
  let originalSendMessageFunction = null;
  
  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', initReplySystem);
  
  function initReplySystem() {
    // Add stylish CSS
    addStylishCSS();
    
    // Setup initial elements and hooks
    setupInitialElements();
    
    // Process existing messages
    processExistingMessages();
    
    // Setup mutation observer for new messages
    setupMessageObserver();
    
    // Intercept the send function
    interceptSendFunction();
  }
  
  function addStylishCSS() {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      /* Reply Button Styles */
      .whatsapp-reply-btn {
        display: flex;
        align-items: center;
        background: none;
        border: none;
        color: #657786;
        cursor: pointer;
        padding: 5px 10px;
        border-radius: 18px;
        transition: all 0.2s ease;
        margin-right: 15px;
      }
      
      .whatsapp-reply-btn:hover {
        color: #1da1f2;
        background-color: rgba(29, 161, 242, 0.1);
      }
      
      .whatsapp-reply-btn svg {
        width: 18px;
        height: 18px;
        fill: currentColor;
        margin-right: 5px;
        transform: scaleX(-1); /* Flip horizontally */
      }
      
      /* Reply Preview Styles */
      .reply-preview-container {
        background-color: #f8f9fa;
        border-left: 4px solid #1da1f2;
        margin: 10px 0;
        padding: 8px 12px;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.12);
        position: relative;
        animation: slideDown 0.3s ease;
        max-width: 100%;
      }
      
      @keyframes slideDown {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .reply-preview-container .reply-close {
        position: absolute;
        right: 8px;
        top: 8px;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: rgba(0,0,0,0.05);
        color: #657786;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
      }
      
      .reply-preview-container .reply-close:hover {
        background: rgba(0,0,0,0.1);
        color: #1da1f2;
      }
      
      .reply-preview-container .reply-to-name {
        font-weight: bold;
        color: #1da1f2;
        margin-bottom: 2px;
        font-size: 14px;
      }
      
      .reply-preview-container .reply-to-text {
        color: #657786;
        font-size: 13px;
        line-height: 1.4;
        word-break: break-word;
        white-space: normal;
      }
      
      /* Reply Indicator in Messages */
      .reply-reference {
        display: flex;
        align-items: center;
        font-size: 13px;
        color: #1da1f2;
        margin-bottom: 5px;
        padding: 3px 8px;
        background: rgba(29, 161, 242, 0.08);
        border-radius: 4px;
        animation: fadeIn 0.3s ease;
        cursor: pointer;
        max-width: fit-content;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .reply-reference:hover {
        background: rgba(29, 161, 242, 0.15);
      }
      
      .reply-reference svg {
        width: 12px;
        height: 12px;
        margin-right: 5px;
        fill: currentColor;
      }
      
      /* Highlight effect for referenced message */
      .message.highlight {
        animation: highlight 1.5s ease;
      }
      
      @keyframes highlight {
        0% { background-color: rgba(29, 161, 242, 0.2); }
        100% { background-color: transparent; }
      }
    `;
    document.head.appendChild(styleEl);
  }
  
  function setupInitialElements() {
    // Create a hidden input to store reply data
    const replyDataInput = document.createElement('input');
    replyDataInput.type = 'hidden';
    replyDataInput.id = 'replyData';
    document.body.appendChild(replyDataInput);
  }
  
  function processExistingMessages() {
    const messages = document.querySelectorAll('.message');
    messages.forEach(enhanceMessage);
  }
  
  function setupMessageObserver() {
    const chatContainer = document.getElementById('chatContainer');
    if (!chatContainer) return;
    
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.addedNodes && mutation.addedNodes.length) {
          mutation.addedNodes.forEach(node => {
            if (node.classList && node.classList.contains('message')) {
              enhanceMessage(node);
              addReplyIndicatorIfNeeded(node);
            }
          });
        }
      });
    });
    
    observer.observe(chatContainer, { childList: true, subtree: true });
  }
  
  function enhanceMessage(messageEl) {
    // Replace the action buttons with our custom reply button
    const actionButtons = messageEl.querySelector('.action-buttons');
    if (!actionButtons || actionButtons.querySelector('.whatsapp-reply-btn')) return;
    
    actionButtons.innerHTML = `
      <button class="whatsapp-reply-btn">
        <svg viewBox="0 0 24 24">
          <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"></path>
        </svg>
        Reply
      </button>
    `;
    
    const replyBtn = actionButtons.querySelector('.whatsapp-reply-btn');
    replyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      createReplyPreview(messageEl);
    });
  }
  
  function addReplyIndicatorIfNeeded(messageEl) {
    // Check if this message is a reply to another message
    const messageContent = messageEl.querySelector('.message-content');
    if (!messageContent) return;
    
    // First try to get data from attributes
    let parentId = messageEl.getAttribute('data-parent-message-id');
    
    // If not found, check if this info is in the message data
    if (!parentId) {
      // This is where you would normally get the parent ID from your message data
      // For demonstration, we'll check if the message ID contains "reply" (you should use your actual data source)
      const messageId = messageEl.getAttribute('data-message-id');
      if (messageId && messageId.includes('reply')) {
        // Extract parent ID logic would go here
      }
    }
    
    // If we have a parent ID, add the indicator
    if (parentId) {
      // Check if indicator already exists
      if (messageContent.querySelector('.reply-reference')) return;
      
      // Find parent message
      const parentMessage = document.querySelector(`[data-message-id="${parentId}"]`);
      if (!parentMessage) return;
      
      const parentUserName = parentMessage.querySelector('.user-name')?.textContent || 'User';
      
      // Create reply indicator
      const indicator = document.createElement('div');
      indicator.className = 'reply-reference';
      indicator.innerHTML = `
        <svg viewBox="0 0 24 24">
          <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01z"></path>
        </svg>
        Replying to ${parentUserName}
      `;
      
      // Insert at the beginning of the message content
      messageContent.insertBefore(indicator, messageContent.firstChild);
      
      // Add click handler to jump to parent message
      indicator.addEventListener('click', () => {
        jumpToMessage(parentId);
      });
    }
  }
  
  function createReplyPreview(messageEl) {
    // Get message data
    const messageId = messageEl.getAttribute('data-message-id');
    const userName = messageEl.querySelector('.user-name')?.textContent || 'User';
    const messageText = messageEl.querySelector('.message-text')?.textContent || '';
    
    // Remove any existing preview
    removeExistingPreview();
    
    // Store reply data
    document.getElementById('replyData').value = messageId;
    
    // Create preview container
    const previewContainer = document.createElement('div');
    previewContainer.className = 'reply-preview-container';
    previewContainer.innerHTML = `
      <div class="reply-close">×</div>
      <div class="reply-to-name">Replying to ${userName}</div>
      <div class="reply-to-text">${truncateText(messageText, 100)}</div>
    `;
    
    // Insert before input container
    const inputContainer = document.querySelector('.input-wrapper');
    inputContainer.parentElement.insertBefore(previewContainer, inputContainer);
    
    // Add close handler
    previewContainer.querySelector('.reply-close').addEventListener('click', removeExistingPreview);
    
    // Focus input
    document.getElementById('messageInput')?.focus();
  }
  
  function removeExistingPreview() {
    const preview = document.querySelector('.reply-preview-container');
    if (preview) {
      // Add exit animation
      preview.style.animation = 'fadeOut 0.2s ease forwards';
      
      // Remove after animation
      setTimeout(() => {
        preview.remove();
      }, 200);
    }
    
    // Clear stored reply data
    document.getElementById('replyData').value = '';
  }
  
  function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
  
  function jumpToMessage(messageId) {
    const targetMessage = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!targetMessage) return;
    
    // Scroll to the message
    targetMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Add highlight effect
    targetMessage.classList.add('highlight');
    
    // Remove highlight after animation completes
    setTimeout(() => {
      targetMessage.classList.remove('highlight');
    }, 1500);
  }
  
  function interceptSendFunction() {
    // Try different approaches to intercept the send function
    
    // Method 1: Override global sendMessage if it exists
    if (typeof window.sendMessage === 'function') {
      originalSendMessageFunction = window.sendMessage;
      window.sendMessage = enhancedSendMessage;
    }
    
    // Method 2: Add event listener to send button
    const sendButton = document.getElementById('sendButton');
    if (sendButton) {
      const originalOnClick = sendButton.onclick;
      sendButton.onclick = function(e) {
        const replyId = document.getElementById('replyData').value;
        
        // If this is a reply, let our function handle it
        if (replyId) {
          e.preventDefault();
          e.stopPropagation();
          sendMessageWithReply(replyId);
          return false;
        }
        
        // Otherwise, let the original handler work
        if (originalOnClick) return originalOnClick.call(this, e);
      };
    }
    
    // Method 3: Intercept Enter key on input
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
      messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          const replyId = document.getElementById('replyData').value;
          if (replyId) {
            e.preventDefault();
            sendMessageWithReply(replyId);
          }
        }
      });
    }
  }
  
  function enhancedSendMessage() {
    const replyId = document.getElementById('replyData').value;
    
    if (replyId) {
      // This is a reply, use our custom function
      sendMessageWithReply(replyId);
    } else {
      // Not a reply, use original function
      if (originalSendMessageFunction) {
        originalSendMessageFunction.apply(this, arguments);
      }
    }
  }
  
  function sendMessageWithReply(parentId) {
    // Get message content from input
    const messageInput = document.getElementById('messageInput');
    const content = messageInput.value.trim();
    
    // If empty, don't send
    if (!content && !document.querySelector('#mediaPreview').children.length) return;
    
    // Try to access your original send function context
    if (originalSendMessageFunction) {
      // Call the original with parentId parameter
      originalSendMessageFunction(parentId);
    } else {
      // Direct Firebase method if we couldn't intercept the original function
      try {
        const database = firebase.database();
        const currentUser = firebase.auth().currentUser;
        
        if (database && currentUser) {
          const messagesRef = database.ref('messages');
          const newMessageRef = messagesRef.push();
          
          // Create message object with parent reference
          const messageData = {
            userId: currentUser.uid,
            text: content,
            timestamp: Date.now(),
            parentMessageId: parentId
            // Include other fields your app needs
          };
          
          // Send to Firebase
          newMessageRef.set(messageData);
          
          // Clear input after sending
          messageInput.value = '';
          
          // Clear media if any
          document.querySelector('#mediaPreview').innerHTML = '';
        }
      } catch (error) {
        console.error('Error sending reply:', error);
      }
    }
    
    // Clear the reply preview
    removeExistingPreview();
  }
})();
