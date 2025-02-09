// Initialize dynamic counters object
const messageLikes = new Map();
const likeAnimations = new Map();

// Add like and share buttons to each message
function addInteractionButtons() {
  const messages = document.querySelectorAll('.message');

  messages.forEach(message => {
    const messageId = message.getAttribute('data-message-id');
    const replySection = message.querySelector('.reply-section');

    // Only add buttons if they don't already exist
    if (!message.querySelector('.interaction-buttons')) {
      const interactionButtons = document.createElement('div');
      interactionButtons.className = 'interaction-buttons';
      interactionButtons.style.display = 'flex';
      interactionButtons.style.alignItems = 'center';
      interactionButtons.style.gap = '15px';
      interactionButtons.style.marginLeft = 'auto';

      // Like Button with Heart Icon
      const likeButton = document.createElement('div');
      likeButton.className = 'like-button';
      likeButton.innerHTML = `
        <svg class="heart-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
        <span class="like-count">0</span>
      `;

      // Initialize message likes if not exists
      if (!messageLikes.has(messageId)) {
        messageLikes.set(messageId, 0);
      }

      // Style the like button
      likeButton.style.display = 'flex';
      likeButton.style.alignItems = 'center';
      likeButton.style.gap = '5px';
      likeButton.style.cursor = 'pointer';
      likeButton.querySelector('.heart-icon').style.transition = 'all 0.3s ease';
      likeButton.querySelector('.like-count').style.transition = 'all 0.3s ease';

      // Share Button with Share Icon
      const shareButton = document.createElement('div');
      shareButton.className = 'share-button';
      shareButton.innerHTML = `
        <svg class="share-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="18" cy="5" r="3"/>
          <circle cx="6" cy="12" r="3"/>
          <circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
      `;

      // Style the share button
      shareButton.style.cursor = 'pointer';
      shareButton.querySelector('.share-icon').style.transition = 'all 0.3s ease';

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

      // Add buttons to interaction container
      interactionButtons.appendChild(likeButton);
      interactionButtons.appendChild(shareButton);
      replySection.appendChild(interactionButtons);
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
    heartIcon.style.fill = 'black';
    heartIcon.style.stroke = 'black';

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
  likeCount.textContent = currentLikes;

  // Save to Firebase
  updateLikeCount(messageId, currentLikes);
}

// Create floating hearts animation
function createFloatingHearts(likeButton) {
  for (let i = 0; i < 5; i++) {
    const heart = document.createElement('div');
    heart.innerHTML = '🖤';
    heart.className = 'floating-heart';
    heart.style.position = 'absolute';
    heart.style.fontSize = '16px';
    heart.style.pointerEvents = 'none';
    heart.style.animation = `float-up 1s ease-out forwards`;
    heart.style.left = `${Math.random() * 20}px`;

    likeButton.appendChild(heart);

    // Remove heart after animation
    setTimeout(() => heart.remove(), 1000);
  }
}

// Handle share button click
function handleShare(messageId) {
  const shareButton = document.querySelector(`[data-message-id="${messageId}"] .share-button`);
  const shareIcon = shareButton.querySelector('.share-icon');

  // Rotate animation
  shareIcon.style.transform = 'rotate(360deg)';
  setTimeout(() => {
    shareIcon.style.transform = 'rotate(0)';
  }, 500);

  // Share functionality
  const shareData = {
    title: 'Shared Message',
    text: document.querySelector(`[data-message-id="${messageId}"] .message-content p`).textContent,
    url: window.location.href
  };

  if (navigator.share) {
    navigator.share(shareData)
      .catch((error) => console.log('Error sharing:', error));
  } else {
    // Fallback copy to clipboard
    navigator.clipboard.writeText(shareData.text)
      .then(() => {
        showToast('Message copied to clipboard!');
      })
      .catch(err => {
        console.log('Error copying text:', err);
      });
  }
}

// Show toast notification
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = message;

  // Style the toast
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '20px',
    zIndex: '1000',
    animation: 'fadeInOut 2s ease-in-out'
  });

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

// Update like count in Firebase
function updateLikeCount(messageId, count) {
  const messageRef = firebase.database().ref(`messages/${messageId}/likes`);
  messageRef.set(count);
}

// Add necessary styles
const style = document.createElement('style');
style.textContent = `
  @keyframes float-up {
    0% {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
    100% {
      transform: translateY(-50px) scale(0);
      opacity: 0;
    }
  }
  
  @keyframes fadeInOut {
    0% { opacity: 0; transform: translate(-50%, 20px); }
    15% { opacity: 1; transform: translate(-50%, 0); }
    85% { opacity: 1; transform: translate(-50%, 0); }
    100% { opacity: 0; transform: translate(-50%, -20px); }
  }
  
  .like-button:hover .heart-icon,
  .share-button:hover .share-icon {
    transform: scale(1.1);
  }
  
  .floating-heart {
    pointer-events: none;
    user-select: none;
  }
`;
document.head.appendChild(style);

// Initialize interaction buttons when new messages are added
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length) {
      addInteractionButtons();
    }
  });
});

// Start observing the chat container for new messages
observer.observe(document.querySelector('.chat-container'), {
  childList: true,
  subtree: true
});

// Initial setup for existing messages
document.addEventListener('DOMContentLoaded', addInteractionButtons);