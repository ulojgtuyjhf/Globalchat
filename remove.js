
(function() {
  'use strict';

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
      
      // Get existing reply button to match its style
      const existingReplyBtn = actionButtons.querySelector('.reply-btn');
      if (!existingReplyBtn) return;
      
      // Force horizontal row layout with proper spacing - preserve existing layout
      actionButtons.style.display = 'flex';
      actionButtons.style.flexDirection = 'row';
      actionButtons.style.alignItems = 'center';
      actionButtons.style.gap = '15px';
      
      // Create container for right-side buttons (like and share)
      let rightButtons = actionButtons.querySelector('.right-action-buttons');
      if (!rightButtons) {
        rightButtons = document.createElement('div');
        rightButtons.className = 'right-action-buttons';
        rightButtons.style.display = 'flex';
        rightButtons.style.marginLeft = 'auto';
        rightButtons.style.gap = '15px';
        actionButtons.appendChild(rightButtons);
      }
      
      // Create Like Button with matching styles to reply button
      if (!actionButtons.querySelector('.like-button')) {
        const likeButton = document.createElement('button');
        likeButton.className = 'action-button like-button';
        likeButton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd" viewBox="0 0 399 512.34" fill="currentColor">
  <path fill-rule="nonzero" d="m0 84.87.03-.01c0-4.73 3.84-8.57 8.58-8.57h223.02V8.59c.02-1.96.69-3.94 2.05-5.55 3.06-3.62 8.48-4.07 12.1-1.01l150.06 127.4c.4.33.77.69 1.11 1.1 3.06 3.62 2.61 9.04-1.01 12.1L246.21 269.75a8.584 8.584 0 0 1-5.97 2.41 8.61 8.61 0 0 1-8.61-8.61v-67.67H119.62v32.96c-.03 2.42-1.04 4.83-3.03 6.52L14.65 322.62a8.543 8.543 0 0 1-6.04 2.48c-4.75 0-8.61-3.85-8.61-8.6V84.87zm399 342.6-.03.01c0 4.73-3.84 8.57-8.58 8.57H167.37v67.71a8.696 8.696 0 0 1-2.05 5.54c-3.06 3.62-8.48 4.07-12.1 1.01L3.16 382.91c-.4-.33-.77-.69-1.11-1.09-3.06-3.62-2.61-9.05 1.01-12.11L152.79 242.6a8.584 8.584 0 0 1 5.97-2.41c4.75 0 8.61 3.85 8.61 8.6v67.67h112.01V283.5a8.703 8.703 0 0 1 3.03-6.52l101.94-87.26a8.604 8.604 0 0 1 6.04-2.48 8.61 8.61 0 0 1 8.61 8.61v231.62zm-17.21-8.57V214.52l-85.2 72.91v37.64a8.6 8.6 0 0 1-8.6 8.6H158.76a8.6 8.6 0 0 1-8.6-8.6v-57.7L21.88 376.27l128.28 108.91v-57.71a8.6 8.6 0 0 1 8.6-8.6l223.03.03zM17.21 93.44v204.39l85.2-72.92v-37.63c0-4.76 3.85-8.61 8.6-8.61h129.23a8.61 8.61 0 0 1 8.61 8.61v57.7l128.27-108.91L248.85 27.16v57.71c0 4.75-3.86 8.6-8.61 8.6l-223.03-.03z"/>
</svg>
          
        `;

        // Match existing button styles
        copyButtonStyles(existingReplyBtn, likeButton);

        // Initialize like count if needed
        if (!messageLikes.has(messageId)) {
          messageLikes.set(messageId, 0);
        }
        
        likeButton.addEventListener('click', function(e) {
          e.stopPropagation();
          handleLike(messageId, this);
        });
        rightButtons.appendChild(likeButton);
      }

      // Create Share Button with matching styles
      if (!actionButtons.querySelector('.share-button')) {
        const shareButton = document.createElement('button');
        shareButton.className = 'action-button share-button';
        shareButton.innerHTML = `
          <?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 122.88 103.44" style="enable-background:new 0 0 122.88 103.44" xml:space="preserve" fill="currentColor">
<g>
<path d="M69.49,102.77L49.8,84.04l-20.23,18.27c-0.45,0.49-1.09,0.79-1.8,0.79c-1.35,0-2.44-1.09-2.44-2.44V60.77L0.76,37.41 c-0.98-0.93-1.01-2.47-0.09-3.45c0.31-0.33,0.7-0.55,1.11-0.67l0,0l118-33.2c1.3-0.36,2.64,0.39,3.01,1.69 c0.19,0.66,0.08,1.34-0.24,1.89l-49.2,98.42c-0.6,1.2-2.06,1.69-3.26,1.09C69.86,103.07,69.66,102.93,69.49,102.77L69.49,102.77 L69.49,102.77z M46.26,80.68L30.21,65.42v29.76L46.26,80.68L46.26,80.68z M28.15,56.73l76.32-47.26L7.22,36.83L28.15,56.73 L28.15,56.73z M114.43,9.03L31.79,60.19l38.67,36.78L114.43,9.03L114.43,9.03z"/>
</g>
</svg>
        `;

        // Match existing button styles
        copyButtonStyles(existingReplyBtn, shareButton);

        shareButton.addEventListener('click', function(e) {
          e.stopPropagation();
          handleShare(messageId);
        });
        rightButtons.appendChild(shareButton);
      }
    });
  }

  // Copy styles from existing button to new button
  function copyButtonStyles(sourceBtn, targetBtn) {
    if (!sourceBtn || !targetBtn) return;
    
    const computedStyle = window.getComputedStyle(sourceBtn);
    
    // Copy font properties
    targetBtn.style.fontSize = computedStyle.fontSize;
    targetBtn.style.fontFamily = computedStyle.fontFamily;
    targetBtn.style.fontWeight = computedStyle.fontWeight;
    
    // Copy layout and size
    targetBtn.style.padding = computedStyle.padding;
    targetBtn.style.height = computedStyle.height;
    targetBtn.style.display = 'flex';
    targetBtn.style.alignItems = 'center';
    
    // Copy svg sizing from source
    const sourceSvg = sourceBtn.querySelector('svg');
    const targetSvg = targetBtn.querySelector('svg');
    
    if (sourceSvg && targetSvg) {
      const svgStyle = window.getComputedStyle(sourceSvg);
      targetSvg.style.width = svgStyle.width;
      targetSvg.style.height = svgStyle.height;
    }
  }

  // Handle like button click
  function handleLike(messageId, likeButton) {
    let currentLikes = messageLikes.get(messageId) || 0;
    const heartIcon = likeButton.querySelector('.heart-icon');
    const likeCount = likeButton.querySelector('.like-count');

    if (!likeButton.classList.contains('liked')) {
      currentLikes++;
      likeButton.classList.add('liked');
      heartIcon.style.fill = '#4a90e2';
      createFloatingHearts(likeButton);
    } else {
      currentLikes--;
      likeButton.classList.remove('liked');
      heartIcon.style.fill = 'none';
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
      heart.innerHTML = '💙';
      heart.className = 'floating-heart';
      heart.style.position = 'absolute';
      heart.style.fontSize = '14px';
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
    if (shareIcon) {
      shareIcon.style.fill = '#4a90e2';
      setTimeout(() => {
        shareIcon.style.fill = 'none';
      }, 500);
    }
    
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageElement) return;
    const messageTextEl = messageElement.querySelector('.message-text');
    const userNameEl = messageElement.querySelector('.user-name');
    if (!messageTextEl || !userNameEl) return;
    const messageText = messageTextEl.textContent;
    const userName = userNameEl.textContent;
    
    const shareData = {
      title: `${userName} on GlobalChat`,
      text: messageText,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData).catch((error) => console.log('Error sharing:', error));
    } else {
      navigator.clipboard.writeText(`${userName}: "${messageText}"`).then(() => {
        showToast('Message copied to clipboard!');
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
      backgroundColor: '#4a90e2',
      color: 'white',
      padding: '10px 20px',
      borderRadius: '20px',
      zIndex: '1000',
      animation: 'fadeInOut 2s ease-in-out',
      fontWeight: 'bold',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  // Add necessary CSS styles (matching the existing UI)
  const style = document.createElement('style');
  style.textContent = `
    .heart-icon, .share-icon {
      fill: none;
      stroke: var(--text-secondary);
      stroke-width: 2;
      transition: all 0.2s ease;
    }
    .liked .heart-icon {
      fill: var(--primary-color) !important;
      stroke: var(--primary-color) !important;
    }
    .action-button {
      margin-right: 0 !important;
    }
    .like-button:hover .heart-icon, .share-button:hover .share-icon {
      stroke: var(--primary-color);
    }
    .like-count {
      margin-left: 4px;
      font-size: inherit;
    }
    .right-action-buttons {
      display: flex;
      align-items: center;
    }
    @keyframes float-up-0 {
      0% { transform: translateY(0) scale(1); opacity: 1; }
      100% { transform: translateY(-40px) scale(0); opacity: 0; }
    }
    @keyframes float-up-1 {
      0% { transform: translateY(0) scale(1); opacity: 1; }
      100% { transform: translateY(-50px) scale(0); opacity: 0; }
    }
    @keyframes float-up-2 {
      0% { transform: translateY(0) scale(1); opacity: 1; }
      100% { transform: translateY(-45px) scale(0); opacity: 0; }
    }
    @keyframes float-up-3 {
      0% { transform: translateY(0) scale(1); opacity: 1; }
      100% { transform: translateY(-55px) scale(0); opacity: 0; }
    }
    @keyframes float-up-4 {
      0% { transform: translateY(0) scale(1); opacity: 1; }
      100% { transform: translateY(-35px) scale(0); opacity: 0; }
    }
    @keyframes fadeInOut {
      0% { opacity: 0; transform: translate(-50%, 20px); }
      15% { opacity: 1; transform: translate(-50%, 0); }
      85% { opacity: 1; transform: translate(-50%, 0); }
      100% { opacity: 0; transform: translate(-50%, -20px); }
    }
    
    /* Responsive adjustments to match UI */
    @media (max-width: 768px) {
      .right-action-buttons {
        gap: 12px !important;
      }
      .action-button svg {
        width: 16px;
        height: 16px;
      }
    }
    
    @media (max-width: 576px) {
      .action-buttons {
        gap: 10px !important;
      }
      .right-action-buttons {
        gap: 10px !important;
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
})();
