
// Initialize dynamic counters object
const messageLikes = new Map();
const likeAnimations = new Map();

// Add like and share buttons to each message
function addInteractionButtons() {
  const messages = document.querySelectorAll('.message');

  messages.forEach(message => {
    const messageId = message.getAttribute('data-message-id');
    const actionButtons = message.querySelector('.action-buttons');
    
    // Only add buttons if they don't already exist
    if (actionButtons && !actionButtons.querySelector('.like-button')) {
      // Modify action buttons container to have proper spacing
      actionButtons.style.display = 'flex';
      actionButtons.style.justifyContent = 'space-between';
      actionButtons.style.width = '100%';
      actionButtons.style.marginTop = '10px';
      
      // Get the existing reply button
      const replyButton = actionButtons.querySelector('button');
      
      // Create container for the right side buttons
      const rightButtons = document.createElement('div');
      rightButtons.className = 'right-action-buttons';
      rightButtons.style.display = 'flex';
      rightButtons.style.gap = '24px'; // Increased spacing between buttons
      rightButtons.style.marginLeft = 'auto'; // Push to right side
      
      // Like Button with Heart Icon - BIGGER size
      const likeButton = document.createElement('button');
      likeButton.className = 'action-button like-button';
      likeButton.innerHTML = `
        <svg class="heart-icon" viewBox="0 0 24 24" width="22" height="22">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
        <span class="like-count">0</span>
      `;

      // Initialize message likes if not exists
      if (!messageLikes.has(messageId)) {
        messageLikes.set(messageId, 0);
      }

      // Share Button with Share Icon - BIGGER size
      const shareButton = document.createElement('button');
      shareButton.className = 'action-button share-button';
      shareButton.innerHTML = `
        <svg class="share-icon" viewBox="0 0 24 24" width="22" height="22">
          <circle cx="18" cy="5" r="3"/>
          <circle cx="6" cy="12" r="3"/>
          <circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
      `;

      // Add click event for like button
      likeButton.addEventListener('click', function(e) {
        e.stopPropagation();
        handleLike(messageId, this);
      });

      // Add click event for share button
      shareButton.addEventListener('click', function(e) {
        e.stopPropagation();
        handleShare(messageId);
      });

      // Add buttons to right side container
      rightButtons.appendChild(likeButton);
      rightButtons.appendChild(shareButton);
      
      // Clear existing buttons and re-add in correct order
      actionButtons.innerHTML = '';
      actionButtons.appendChild(replyButton);
      actionButtons.appendChild(rightButtons);
    }
  });
}

// Handle like button click
function handleLike(messageId, likeButton) {
  // Get current like count
  let currentLikes = messageLikes.get(messageId) || 0;

  // Toggle like
  const heartIcon = likeButton.querySelector('.heart-icon');
  const likeCount = likeButton.querySelector('.like-count');

  if (!likeButton.classList.contains('liked')) {
    // Like animation
    currentLikes++;
    likeButton.classList.add('liked');
    heartIcon.style.fill = '#e0245e';
    heartIcon.style.stroke = '#e0245e';

    // Bounce animation
    heartIcon.style.transform = 'scale(1.3)';
    setTimeout(() => {
      heartIcon.style.transform = 'scale(1)';
    }, 200);

    // Floating hearts animation
    createFloatingHearts(likeButton);
  } else {
    // Unlike
    currentLikes--;
    likeButton.classList.remove('liked');
    heartIcon.style.fill = 'none';
    heartIcon.style.stroke = 'currentColor';
  }

  // Update count
  messageLikes.set(messageId, currentLikes);
  likeCount.textContent = currentLikes > 0 ? currentLikes : '';

  // Try to update to Firebase if it exists in the context
  try {
    const database = firebase.database();
    if (database) {
      const messageRef = database.ref(`messages/${messageId}/likes`);
      messageRef.set(currentLikes);
    }
  } catch (e) {
    console.log('Firebase not available or not initialized');
  }
}

// Create floating hearts animation
function createFloatingHearts(likeButton) {
  for (let i = 0; i < 5; i++) {
    const heart = document.createElement('div');
    heart.innerHTML = '❤️';
    heart.className = 'floating-heart';
    heart.style.position = 'absolute';
    heart.style.fontSize = '16px';
    heart.style.pointerEvents = 'none';
    heart.style.zIndex = '100';
    heart.style.top = '0';
    heart.style.left = `${Math.random() * 20}px`;
    heart.style.animation = `float-up-${i} 1s ease-out forwards`;
    
    likeButton.style.position = 'relative';
    likeButton.appendChild(heart);

    // Remove heart after animation
    setTimeout(() => {
      if (heart.parentNode === likeButton) {
        likeButton.removeChild(heart);
      }
    }, 1000);
  }
}

// Handle share button click
function handleShare(messageId) {
  const shareButton = document.querySelector(`[data-message-id="${messageId}"] .share-button`);
  const shareIcon = shareButton.querySelector('.share-icon');

  // Rotate animation
  shareIcon.style.transform = 'rotate(360deg)';
  shareIcon.style.transition = 'transform 0.5s ease';
  setTimeout(() => {
    shareIcon.style.transform = 'rotate(0)';
  }, 500);

  // Share functionality
  const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
  const messageText = messageElement.querySelector('.message-text').textContent;
  const userName = messageElement.querySelector('.user-name').textContent;
  
  const shareData = {
    title: `${userName} on GlobalChat`,
    text: messageText,
    url: window.location.href
  };

  if (navigator.share) {
    navigator.share(shareData)
      .catch((error) => console.log('Error sharing:', error));
  } else {
    // Fallback copy to clipboard
    navigator.clipboard.writeText(`${userName}: "${messageText}"`).then(() => {
      showToast('Tweet copied to clipboard!');
    }).catch(err => {
      console.log('Error copying text:', err);
    });
  }
}

// Show toast notification
function showToast(message) {
  // Remove existing toast if present
  const existingToast = document.querySelector('.toast-notification');
  if (existingToast) {
    existingToast.remove();
  }
  
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = message;

  // Style the toast to match Twitter style
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#1da1f2',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '30px',
    zIndex: '1000',
    animation: 'fadeInOut 2s ease-in-out',
    fontWeight: 'bold',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
  });

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

// Add necessary styles
const style = document.createElement('style');
style.textContent = `
  .heart-icon, .share-icon {
    fill: none;
    stroke: #8899a6;
    stroke-width: 2;
    transition: all 0.3s ease;
  }
  
  .liked .heart-icon {
    fill: #e0245e !important;
    stroke: #e0245e !important;
  }
  
  .like-button, .share-button {
    transition: all 0.2s ease;
    color: #8899a6;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  
  .like-button:hover {
    color: #e0245e !important;
  }
  
  .like-button:hover .heart-icon {
    stroke: #e0245e;
  }
  
  .share-button:hover {
    color: #1da1f2 !important;
  }
  
  .share-button:hover .share-icon {
    stroke: #1da1f2;
  }
  
  .like-count {
    font-size: 14px;
  }
  
  /* Make the buttons larger */
  .action-buttons svg {
    width: 22px !important;
    height: 22px !important;
  }
  
  /* Force right-alignment */
  .right-action-buttons {
    margin-left: auto !important;
    margin-right: 0 !important;
  }
  
  /* Increase button size */
  .action-button {
    transform: scale(1.15);
  }
  
  @keyframes float-up-0 {
    0% { transform: translateY(0) scale(1); opacity: 1; }
    100% { transform: translateY(-40px) scale(0); opacity: 0; }
  }
  
  @keyframes float-up-1 {
    0% { transform: translateY(0) scale(1); opacity: 1; }
    100% { transform: translateY(-60px) scale(0); opacity: 0; }
  }
  
  @keyframes float-up-2 {
    0% { transform: translateY(0) scale(1); opacity: 1; }
    100% { transform: translateY(-50px) scale(0); opacity: 0; }
  }
  
  @keyframes float-up-3 {
    0% { transform: translateY(0) scale(1); opacity: 1; }
    100% { transform: translateY(-70px) scale(0); opacity: 0; }
  }
  
  @keyframes float-up-4 {
    0% { transform: translateY(0) scale(1); opacity: 1; }
    100% { transform: translateY(-45px) scale(0); opacity: 0; }
  }
  
  @keyframes fadeInOut {
    0% { opacity: 0; transform: translate(-50%, 20px); }
    15% { opacity: 1; transform: translate(-50%, 0); }
    85% { opacity: 1; transform: translate(-50%, 0); }
    100% { opacity: 0; transform: translate(-50%, -20px); }
  }
  
  .floating-heart {
    pointer-events: none;
    user-select: none;
  }
  
  .toast-notification {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  
  /* Fix reply input */
  .reply-input {
    margin-top: 5px !important;
  }
`;
document.head.appendChild(style);

// Add a reply toggle functionality that works with your HTML structure
window.toggleReplyInput = function(messageId) {
  const parentMessage = document.querySelector(`[data-message-id="${messageId}"]`);
  let replyInput = parentMessage.querySelector('.reply-input');
  
  if (replyInput) {
    replyInput.remove();
  } else {
    replyInput = document.createElement('div');
    replyInput.className = 'reply-input';
    replyInput.innerHTML = `
      <div class="reply-wrapper">
        <textarea class="reply-textarea" placeholder="Tweet your reply..."></textarea>
        <button class="reply-send" onclick="sendReply('${messageId}')">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
            <path d="M2.252 6.456l19.476 5.825c.53.159.53.928 0 1.088L2.252 19.194c-.43.129-.81-.303-.53-.604l4.309-4.672c.45-.487.45-1.256 0-1.742L1.722 7.06c-.28-.302.1-.733.53-.604z"></path>
          </svg>
        </button>
      </div>
    `;
    
    parentMessage.appendChild(replyInput);
    
    // Focus the textarea
    setTimeout(() => {
      parentMessage.querySelector('.reply-textarea').focus();
    }, 100);
  }
};

// Initial setup for existing messages
document.addEventListener('DOMContentLoaded', function() {
  addInteractionButtons();
  
  // Start observing the chat container for new messages
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        setTimeout(addInteractionButtons, 100);
      }
    });
  });

  // Start observing
  const chatContainer = document.getElementById('chatContainer');
  if (chatContainer) {
    observer.observe(chatContainer, {
      childList: true,
      subtree: true
    });
  }
});
