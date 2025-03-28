// Initialize dynamic counters object
const messageLikes = new Map();
const likeAnimations = new Map();

// Add like and share buttons to each message in a horizontal layout
function addInteractionButtons() {
  const messages = document.querySelectorAll('.message');

  messages.forEach(message => {
    const messageId = message.getAttribute('data-message-id');
    const actionButtons = message.querySelector('.action-buttons');
    if (!actionButtons) return;
    
    // Force horizontal row layout with proper spacing
    actionButtons.style.display = 'flex';
    actionButtons.style.flexDirection = 'row';
    actionButtons.style.alignItems = 'center';
    actionButtons.style.justifyContent = 'flex-start';
    actionButtons.style.width = '100%';
    actionButtons.style.marginTop = '10px';
    actionButtons.style.gap = '12px';
    
    // Identify the existing reply (comment) button (assumed to be present)
    const replyButton = actionButtons.querySelector('button');
    if (replyButton) {
      // Ensure the reply button stays on the left
      replyButton.style.order = '0';
    }
    
    // Create container for right-side buttons (like and share)
    const rightButtons = document.createElement('div');
    rightButtons.className = 'right-action-buttons';
    rightButtons.style.display = 'flex';
    rightButtons.style.flexDirection = 'row';
    rightButtons.style.alignItems = 'center';
    rightButtons.style.gap = '12px';
    rightButtons.style.marginLeft = 'auto';
    rightButtons.style.order = '1';
    
    // Create Like Button with Heart Icon
    const likeButton = document.createElement('button');
    likeButton.className = 'action-button like-button';
    likeButton.innerHTML = `
      <svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 91.5 122.88">
        <defs><style>.cls-1{fill-rule:evenodd;}</style></defs>
        <title>add-bookmark</title>
        <path class="cls-1 heart-icon" d="M62.42,0A29.08,29.08,0,1,1,33.34,29.08,29.08,29.08,0,0,1,62.42,0ZM3.18,19.65H24.73a38,38,0,0,0-1,6.36H6.35v86.75L37.11,86.12a3.19,3.19,0,0,1,4.18,0l31,26.69V66.68a39.26,39.26,0,0,0,6.35-2.27V119.7a3.17,3.17,0,0,1-5.42,2.24l-34-29.26-34,29.42a3.17,3.17,0,0,1-4.47-.33A3.11,3.11,0,0,1,0,119.7H0V22.83a3.18,3.18,0,0,1,3.18-3.18Zm55-2.79a4.1,4.1,0,0,1,.32-1.64l0-.06a4.33,4.33,0,0,1,3.9-2.59h0a4.23,4.23,0,0,1,1.63.32,4.3,4.3,0,0,1,1.39.93,4.15,4.15,0,0,1,.93,1.38l0,.07a4.23,4.23,0,0,1,.3,1.55v8.6h8.57a4.3,4.3,0,0,1,3,1.26,4.23,4.23,0,0,1,.92,1.38l0,.07a4.4,4.4,0,0,1,.31,1.49v.18a4.37,4.37,0,0,1-.32,1.55,4.45,4.45,0,0,1-.93,1.4,4.39,4.39,0,0,1-1.38.92l-.08,0a4.14,4.14,0,0,1-1.54.3H66.71v8.57a4.35,4.35,0,0,1-1.25,3l-.09.08a4.52,4.52,0,0,1-1.29.85l-.08,0a4.36,4.36,0,0,1-1.54.31h0a4.48,4.48,0,0,1-1.64-.32,4.3,4.3,0,0,1-1.39-.93,4.12,4.12,0,0,1-.92-1.38,4.3,4.3,0,0,1-.34-1.62V34H49.56a4.28,4.28,0,0,1-1.64-.32l-.07,0a4.32,4.32,0,0,1-2.25-2.28l0-.08a4.58,4.58,0,0,1-.3-1.54v0a4.39,4.39,0,0,1,.33-1.63,4.3,4.3,0,0,1,3.93-2.66h8.61V16.86Z"/>
      <span class="like-count"></span>
      `;
    
    // Initialize like count if needed
    if (!messageLikes.has(messageId)) {
      messageLikes.set(messageId, 0);
    }
    
    likeButton.addEventListener('click', function(e) {
      e.stopPropagation();
      handleLike(messageId, this);
    });
    
    // Create Share Button with Share Icon
    const shareButton = document.createElement('button');
    shareButton.className = 'action-button share-button';
    shareButton.innerHTML = `
      <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" 
           xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" 
           viewBox="0 0 122.88 103.44" style="enable-background:new 0 0 122.88 103.44" xml:space="preserve">
        <g>
          <path d="M69.49,102.77L49.8,84.04l-20.23,18.27c-0.45,0.49-1.09,0.79-1.8,0.79c-1.35,0-2.44-1.09-2.44-2.44V60.77L0.76,37.41 c-0.98-0.93-1.01-2.47-0.09-3.45c0.31-0.33,0.7-0.55,1.11-0.67l0,0l118-33.2c1.3-0.36,2.64,0.39,3.01,1.69 c0.19,0.66,0.08,1.34-0.24,1.89l-49.2,98.42c-0.6,1.2-2.06,1.69-3.26,1.09C69.86,103.07,69.66,102.93,69.49,102.77L69.49,102.77 L69.49,102.77z M46.26,80.68L30.21,65.42v29.76L46.26,80.68z M28.15,56.73l76.32-47.26L7.22,36.83L28.15,56.73z M114.43,9.03L31.79,60.19l38.67,36.78L114.43,9.03L114.43,9.03z"/>
        </g>
      </svg>
      `;
    
    shareButton.addEventListener('click', function(e) {
      e.stopPropagation();
      handleShare(messageId);
    });
    
    // Append like and share buttons into the right-side container
    rightButtons.appendChild(likeButton);
    rightButtons.appendChild(shareButton);
    
    // Append the right-side container if it hasn't been added already
    if (!actionButtons.querySelector('.right-action-buttons')) {
      actionButtons.appendChild(rightButtons);
    }
  });
}

// Handle like button click
function handleLike(messageId, likeButton) {
  let currentLikes = messageLikes.get(messageId) || 0;
  const heartIcon = likeButton.querySelector('.heart-icon');
  const likeCount = likeButton.querySelector('.like-count');

  if (!likeButton.classList.contains('liked')) {
    currentLikes++;
    likeButton.classList.add('liked');
    heartIcon.style.fill = '#1da1f2';
    heartIcon.style.stroke = '#1da1f2';
    heartIcon.style.transform = 'scale(1.3)';
    setTimeout(() => {
      heartIcon.style.transform = 'scale(1)';
    }, 200);
    createFloatingHearts(likeButton);
  } else {
    currentLikes--;
    likeButton.classList.remove('liked');
    heartIcon.style.fill = 'none';
    heartIcon.style.stroke = 'currentColor';
  }
  
  messageLikes.set(messageId, currentLikes);
  likeCount.textContent = currentLikes > 0 ? currentLikes : '';
  
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
    heart.innerHTML = '🟦';
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
  shareIcon.style.transform = 'rotate(360deg)';
  shareIcon.style.transition = 'transform 0.5s ease';
  setTimeout(() => {
    shareIcon.style.transform = 'rotate(0)';
  }, 500);
  
  const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
  const messageText = messageElement.querySelector('.message-text').textContent;
  const userName = messageElement.querySelector('.user-name').textContent;
  
  const shareData = {
    title: `${userName} on GlobalChat`,
    text: messageText,
    url: window.location.href
  };

  if (navigator.share) {
    navigator.share(shareData).catch((error) => console.log('Error sharing:', error));
  } else {
    navigator.clipboard.writeText(`${userName}: "${messageText}"`).then(() => {
      showToast('Tweet copied to clipboard!');
    }).catch(err => {
      console.log('Error copying text:', err);
    });
  }
}

// Show toast notification
function showToast(message) {
  const existingToast = document.querySelector('.toast-notification');
  if (existingToast) {
    existingToast.remove();
  }
  
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = message;
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

// Add necessary CSS styles (including responsive adjustments)
const style = document.createElement('style');
style.textContent = `
  .heart-icon, .share-icon {
    fill: none;
    stroke: #8899a6;
    stroke-width: 2;
    transition: all 0.3s ease;
  }
  .liked .heart-icon {
    fill: #1da1f2 !important;
    stroke: #1da1f2 !important;
  }
  .like-button, .share-button {
    transition: all 0.2s ease;
    color: #8899a6;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
  }
  .like-button:hover {
    color: #1da1f2 !important;
  }
  .like-button:hover .heart-icon {
    stroke: #1da1f2;
  }
  .share-button:hover {
    color: #1da1f2 !important;
  }
  .share-button:hover .share-icon {
    stroke: #1da1f2;
  }
  .like-count {
    font-size: 14px;
    min-width: 10px;
    text-align: center;
  }
  .action-buttons button {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
  }
  .right-action-buttons {
    margin-left: auto !important;
    margin-right: 0 !important;
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
  .action-buttons {
    padding-right: 8px !important;
  }
  @media (max-width: 480px) {
    .action-buttons {
      flex-direction: column;
      align-items: flex-start;
    }
    .right-action-buttons {
      margin-left: 0;
      margin-top: 8px;
      order: 0;
    }
  }
`;
document.head.appendChild(style);

// Observe DOM changes for newly added messages
document.addEventListener('DOMContentLoaded', function() {
  addInteractionButtons();
  const chatContainer = document.getElementById('chatContainer');
  if (chatContainer) {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length) {
          setTimeout(addInteractionButtons, 100);
        }
      });
    });
    observer.observe(chatContainer, { childList: true, subtree: true });
  }
});