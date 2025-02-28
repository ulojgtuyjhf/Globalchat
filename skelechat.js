
const skeletonLoader = {
  init() {
    this.chatContainer = document.getElementById('chatContainer');
    this.hasLoaded = false;
    this.addStyles();
  },

  addStyles() {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      /* Main skeleton styles */
      .skeleton-message {
        display: flex;
        padding: 12px 15px;
        border-bottom: 1px solid #E1E8ED;
        position: relative;
        background-color: #fff;
        overflow: hidden;
      }

      /* Adapt to app's theme */
      body[style*="background-color: #15202b"] .skeleton-message,
      .dark-mode .skeleton-message {
        background-color: #15202b;
        border-bottom: 1px solid #38444d;
      }

      /* Profile picture */
      .skeleton-profile {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background-color: #F5F8FA;
        margin-right: 12px;
        flex-shrink: 0;
      }

      body[style*="background-color: #15202b"] .skeleton-profile,
      .dark-mode .skeleton-profile {
        background-color: #253341;
      }

      /* Content container */
      .skeleton-content {
        flex: 1;
      }

      /* Header with name and handle */
      .skeleton-header {
        display: flex;
        align-items: center;
        margin-bottom: 6px;
      }

      .skeleton-name {
        width: 140px;
        height: 16px;
        background-color: #F5F8FA;
        border-radius: 4px;
        margin-right: 8px;
      }

      .skeleton-handle {
        width: 90px;
        height: 16px;
        background-color: #F5F8FA;
        border-radius: 4px;
        opacity: 0.7;
      }

      body[style*="background-color: #15202b"] .skeleton-name,
      body[style*="background-color: #15202b"] .skeleton-handle,
      .dark-mode .skeleton-name,
      .dark-mode .skeleton-handle {
        background-color: #253341;
      }

      /* Message text lines */
      .skeleton-text-line {
        height: 16px;
        background-color: #F5F8FA;
        border-radius: 4px;
        margin-bottom: 6px;
      }

      .skeleton-text-line:nth-child(1) {
        width: 100%;
      }

      .skeleton-text-line:nth-child(2) {
        width: 92%;
      }

      .skeleton-text-line:nth-child(3) {
        width: 65%;
      }

      body[style*="background-color: #15202b"] .skeleton-text-line,
      .dark-mode .skeleton-text-line {
        background-color: #253341;
      }

      /* Media preview */
      .skeleton-media {
        width: 100%;
        height: 200px;
        background-color: #F5F8FA;
        border-radius: 14px;
        margin: 10px 0;
        display: none;
      }

      .skeleton-with-media .skeleton-media {
        display: block;
      }

      body[style*="background-color: #15202b"] .skeleton-media,
      .dark-mode .skeleton-media {
        background-color: #253341;
      }

      /* Action buttons */
      .skeleton-actions {
        display: flex;
        margin-top: 12px;
      }

      .skeleton-action {
        width: 36px;
        height: 16px;
        background-color: #F5F8FA;
        border-radius: 4px;
        margin-right: 24px;
      }

      body[style*="background-color: #15202b"] .skeleton-action,
      .dark-mode .skeleton-action {
        background-color: #253341;
      }

      /* ✨ ENHANCED SHIMMER EFFECT ✨ */
      .skeleton-shimmer {
        position: relative;
        overflow: hidden;
      }
      
      .skeleton-shimmer::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 200%;
        height: 100%;
        background: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.6) 20%, 
          rgba(255, 255, 255, 0.8) 50%,
          rgba(255, 255, 255, 0.6) 80%,
          rgba(255, 255, 255, 0) 100%
        );
        animation: shimmerEffect 2s infinite;
        transform: translateX(-100%);
      }
      
      body[style*="background-color: #15202b"] .skeleton-shimmer::after,
      .dark-mode .skeleton-shimmer::after {
        background: linear-gradient(
          90deg,
          rgba(21, 32, 43, 0) 0%,
          rgba(39, 51, 64, 0.4) 20%,
          rgba(59, 71, 84, 0.8) 50%,
          rgba(39, 51, 64, 0.4) 80%,
          rgba(21, 32, 43, 0) 100%
        );
      }

      @keyframes shimmerEffect {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(100%);
        }
      }

      /* Animations for loading and unloading */
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(15px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .skeleton-message {
        animation: fadeIn 0.4s ease-out forwards;
      }

      @keyframes fadeOut {
        from {
          opacity: 1;
          transform: translateY(0);
        }
        to {
          opacity: 0;
          transform: translateY(-15px);
        }
      }

      /* New message highlight effect */
      @keyframes newMessageGlow {
        0% {
          box-shadow: 0 0 15px rgba(29, 161, 242, 0.5);
          background-color: rgba(29, 161, 242, 0.1);
        }
        100% {
          box-shadow: none;
          background-color: transparent;
        }
      }

      .message-new {
        animation: newMessageGlow 1.5s ease-out;
      }
    `;
    document.head.appendChild(styleSheet);
  },

  createSkeletonMessage(withMedia = false) {
    const messageEl = document.createElement('div');
    messageEl.className = `skeleton-message skeleton-shimmer ${withMedia ? 'skeleton-with-media' : ''}`;
    
    // Check if dark mode is active
    const isDarkMode = document.body.style.backgroundColor === '#15202b' || 
                       document.body.classList.contains('dark-mode');
    if (isDarkMode) {
      messageEl.classList.add('dark-mode');
    }
    
    messageEl.innerHTML = `
      <div class="skeleton-profile"></div>
      <div class="skeleton-content">
        <div class="skeleton-header">
          <div class="skeleton-name"></div>
          <div class="skeleton-handle"></div>
        </div>
        <div class="skeleton-text">
          <div class="skeleton-text-line"></div>
          <div class="skeleton-text-line"></div>
          <div class="skeleton-text-line"></div>
        </div>
        <div class="skeleton-media"></div>
        <div class="skeleton-actions">
          <div class="skeleton-action"></div>
          <div class="skeleton-action"></div>
          <div class="skeleton-action"></div>
          <div class="skeleton-action"></div>
        </div>
      </div>
    `;
    return messageEl;
  },

  showInitialLoading(count = 5) {
    if (this.hasLoaded) return;
    
    // Hide the loading dots
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }

    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      // Add variety - some messages with media
      const hasMedia = Math.random() > 0.7;
      const skeletonMsg = this.createSkeletonMessage(hasMedia);
      
      // Add slight delay between items appearing
      skeletonMsg.style.animationDelay = `${i * 0.1}s`;
      
      fragment.appendChild(skeletonMsg);
    }
    this.chatContainer.appendChild(fragment);
  },

  hideLoading() {
    if (this.hasLoaded) return;

    const skeletons = this.chatContainer.querySelectorAll('.skeleton-message');
    skeletons.forEach((skeleton, index) => {
      setTimeout(() => {
        skeleton.style.animation = 'fadeOut 0.4s ease-out forwards';
        setTimeout(() => skeleton.remove(), 400);
      }, index * 100); // Staggered removal
    });

    this.hasLoaded = true;
  },
  
  // For new messages that come in
  addMessageWithShimmer(element) {
    // Add shimmer effect to new messages
    element.classList.add('message-new');
    
    // Add shimmer overlay 
    const shimmerOverlay = document.createElement('div');
    shimmerOverlay.className = 'message-shimmer-overlay';
    shimmerOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%);
      animation: messageShimmer 1.5s ease-out;
    `;
    
    element.appendChild(shimmerOverlay);
    
    // Remove shimmer overlay after animation
    setTimeout(() => {
      if (shimmerOverlay && shimmerOverlay.parentNode) {
        shimmerOverlay.parentNode.removeChild(shimmerOverlay);
      }
    }, 1500);
  },
  
  // Show loading when fetching more messages
  showMoreLoading(count = 3, atTop = true) {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const hasMedia = Math.random() > 0.7;
      fragment.appendChild(this.createSkeletonMessage(hasMedia));
    }
    
    if (atTop && this.chatContainer.firstChild) {
      this.chatContainer.insertBefore(fragment, this.chatContainer.firstChild);
    } else {
      this.chatContainer.appendChild(fragment);
    }
    
    // Return the skeleton elements so they can be removed later
    return atTop ? 
      this.chatContainer.querySelectorAll('.skeleton-message:nth-child(-n+' + count + ')') :
      this.chatContainer.querySelectorAll('.skeleton-message:nth-last-child(-n+' + count + ')');
  }
};

// Helper function to show shimmer on new messages (can be called when a new message is added)
function addShimmerToNewMessage(messageElement) {
  skeletonLoader.addMessageWithShimmer(messageElement);
}

// Initialize when document loads
document.addEventListener('DOMContentLoaded', () => {
  skeletonLoader.init();
  skeletonLoader.showInitialLoading(6);

  // Simulate messages loading after a delay
  setTimeout(() => {
    skeletonLoader.hideLoading();
    
    // You can then load your real messages
    // loadMessages();
  }, 2000);
  
  // Example of how to use the shimmer effect for new messages
  document.addEventListener('newMessageAdded', (event) => {
    if (event.detail && event.detail.element) {
      addShimmerToNewMessage(event.detail.element);
    }
  });
});
