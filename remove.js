document.addEventListener('DOMContentLoaded', () => {
  // Add close button styling
  const style = document.createElement('style');
  style.textContent = `
    .message-close-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 30px;
      height: 30px;
      background: white;
      color: black;
      border: 1px solid rgba(0,0,0,0.1);
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: bold;
      opacity: 0;
      transition: all 0.3s ease;
      z-index: 10;
      box-shadow: 
        0 2px 4px rgba(0,0,0,0.1);
    }

    .message:hover .message-close-btn {
      opacity: 1;
    }

    .message-close-btn:hover {
      background: #f0f0f0;
      transform: scale(1.1);
      box-shadow: 
        0 4px 6px rgba(0,0,0,0.15);
    }

    .message-close-btn:active {
      transform: scale(0.95);
      box-shadow: 
        0 1px 2px rgba(0,0,0,0.1);
    }
  `;
  document.head.appendChild(style);

  // Function to add close buttons to messages
  function addCloseButtons() {
    const messages = document.querySelectorAll('.message');
    
    messages.forEach(message => {
      // Check if close button already exists
      if (message.querySelector('.message-close-btn')) return;

      // Create close button
      const closeButton = document.createElement('button');
      closeButton.innerHTML = '×';
      closeButton.classList.add('message-close-btn');

      // Add click event to remove message locally
      closeButton.addEventListener('click', () => {
        // Animate out before removing
        message.style.transition = 'all 0.3s ease';
        message.style.opacity = '0';
        message.style.transform = 'translateX(100%)';
        
        // Remove from DOM after animation
        setTimeout(() => {
          message.remove();
        }, 300);

        // Optional: Save removed messages to local storage
        const removedMessages = JSON.parse(localStorage.getItem('removedMessages') || '[]');
        const messageId = message.getAttribute('data-message-id');
        
        if (messageId && !removedMessages.includes(messageId)) {
          removedMessages.push(messageId);
          localStorage.setItem('removedMessages', JSON.stringify(removedMessages));
        }
      });

      // Append close button to message
      message.style.position = 'relative';
      message.appendChild(closeButton);
    });
  }

  // Add close buttons to existing and future messages
  addCloseButtons();

  // Use MutationObserver to add buttons to dynamically added messages
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        addCloseButtons();
      }
    });
  });

  // Observe the chat container for new messages
  const chatContainer = document.getElementById('chatContainer');
  if (chatContainer) {
    observer.observe(chatContainer, { 
      childList: true, 
      subtree: true 
    });
  }

  // Restore local message removals on page load
  function restoreRemovedMessages() {
    const removedMessages = JSON.parse(localStorage.getItem('removedMessages') || '[]');
    
    removedMessages.forEach(messageId => {
      const message = document.querySelector(`[data-message-id="${messageId}"]`);
      if (message) {
        message.remove();
      }
    });
  }

  // Call restore function on page load
  restoreRemovedMessages();
});