document.addEventListener('DOMContentLoaded', () => {
  // Keep existing styles but remove reply form related ones since we're changing the approach
  const style = document.createElement('style');
  style.textContent = `
    .reply-section {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 4px 0;
      padding: 2px;
    }

    .reply-icon {
      cursor: pointer;
      padding: 4px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      background: none;
      border: none;
      opacity: 0.6;
      transition: all 0.2s ease;
    }

    .reply-icon:hover {
      opacity: 1;
      transform: scale(1.1);
      background: rgba(0, 0, 0, 0.05);
    }

    .reply-count {
      font-size: 12px;
      color: #333;
      margin-left: 2px;
    }

    .double-arrow {
      display: flex;
      align-items: center;
    }
  `;
  document.head.appendChild(style);
  
  const replyIcon = `
    <div class="double-arrow">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 10h10a5 5 0 0 1 5 5v4" />
        <path d="M3 10l5-5" />
        <path d="M3 10l5 5" />
      </svg>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 10h10a5 5 0 0 1 5 5v4" />
        <path d="M3 10l5-5" />
        <path d="M3 10l5 5" />
      </svg>
    </div>
  `;
  
  // Initialize reply sections
  function initializeReplySections() {
    document.querySelectorAll('.reply-section').forEach(section => {
      const messageId = section.closest('.message').getAttribute('data-message-id');
      const username = section.closest('.message').querySelector('h4').childNodes[0].textContent.trim();
      
      section.innerHTML = `
        <button class="reply-icon" onclick="handleReply('${username}', '${messageId}')">
          ${replyIcon}
          <span class="reply-count" id="count-${messageId}">0</span>
        </button>
      `;
    });
  }
  
  // Global function to handle reply
  window.handleReply = (username, messageId) => {
    const mainInput = document.getElementById('messageInput');
    mainInput.value = `@${username}; ${mainInput.value}`;
    mainInput.focus();
    
    // Update reply count in real-time
    const countElement = document.getElementById(`count-${messageId}`);
    const currentCount = parseInt(countElement.textContent || '0');
    countElement.textContent = currentCount + 1;
    
    // Update Firebase counter
    const database = firebase.database();
    const messageRef = database.ref(`messages/${messageId}`);
    messageRef.transaction((message) => {
      if (message) {
        message.replyCount = (message.replyCount || 0) + 1;
      }
      return message;
    });
  };
  
  // Initialize on load
  initializeReplySections();
  
  // Watch for new messages and initialize their reply sections
  const chatContainer = document.getElementById('chatContainer');
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.classList?.contains('message')) {
          const replySection = node.querySelector('.reply-section');
          if (replySection) {
            initializeReplySections();
          }
        }
      });
    });
  });
  
  observer.observe(chatContainer, { childList: true });
});