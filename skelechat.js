// Skeleton Loader for Messages
  const skeletonLoader = {
    init() {
      this.chatContainer = document.getElementById('chatContainer');
      this.hasLoaded = false;
      this.addStyles();
    },

    addStyles() {
      const styleSheet = document.createElement('style');
      styleSheet.textContent = `
      .skeleton-message {
        background: linear-gradient(145deg, #f0f5fc, #e6eaf3);
        border-radius: 15px;
        padding: 15px;
        margin-bottom: 15px;
        position: relative;
        overflow: hidden;
        box-shadow: 
          6px 6px 12px rgba(136, 86, 208, 0.15),
          -6px -6px 12px rgba(255, 255, 255, 0.8);
        animation: fadeIn 0.5s ease-in-out;
      }

      .skeleton-header {
        display: flex;
        align-items: center;
        margin-bottom: 15px;
      }

      .skeleton-profile {
        width: 60px;
        height: 60px;
        border-radius: 15px;
        background: #e6eaf3;
        margin-right: 15px;
        box-shadow: 
          3px 3px 6px rgba(136, 86, 208, 0.2),
          -3px -3px 6px rgba(255, 255, 255, 0.7);
      }

      .skeleton-name {
        width: 150px;
        height: 24px;
        background: #e6eaf3;
        border-radius: 6px;
      }

      .skeleton-text {
        width: 100%;
        height: 60px;
        background: #e6eaf3;
        border-radius: 6px;
        margin-bottom: 10px;
      }

      .skeleton-footer {
        width: 100px;
        height: 20px;
        background: #e6eaf3;
        border-radius: 6px;
      }

      .skeleton-shimmer {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.6) 50%,
          rgba(255, 255, 255, 0) 100%
        );
        animation: shimmer 2s infinite;
      }

      /* Enhanced shimmer effect for loaded messages */
      .message {
        position: relative;
        overflow: hidden;
      }

      .message::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 200%;
        height: 100%;
        background: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.8) 50%,
          rgba(255, 255, 255, 0) 100%
        );
        transform: translateX(-100%);
        animation: messageShimmer 1s ease-out forwards;
      }

      @keyframes shimmer {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(100%);
        }
      }

      @keyframes messageShimmer {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(50%);
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes fadeOut {
        from {
          opacity: 1;
          transform: translateY(0);
        }
        to {
          opacity: 0;
          transform: translateY(-10px);
        }
      }

      /* Add bright flash effect for new messages */
      @keyframes brightFlash {
        0% {
          background: linear-gradient(145deg, #f0f5fc, #e6eaf3);
        }
        50% {
          background: linear-gradient(145deg, #ffffff, #f5f8ff);
        }
        100% {
          background: linear-gradient(145deg, #f0f5fc, #e6eaf3);
        }
      }

      .message-new {
        animation: brightFlash 1s ease-out, messageShimmer 1.5s ease-out;
      }
    `;
      document.head.appendChild(styleSheet);
    },

    createSkeletonMessage() {
      const messageEl = document.createElement('div');
      messageEl.className = 'skeleton-message';
      messageEl.innerHTML = `
      <div class="skeleton-header">
        <div class="skeleton-profile"></div>
        <div class="skeleton-name"></div>
      </div>
      <div class="skeleton-text"></div>
      <div class="skeleton-footer"></div>
      <div class="skeleton-shimmer"></div>
    `;
      return messageEl;
    },

    showInitialLoading(count = 5) {
      if (this.hasLoaded) return;

      const fragment = document.createDocumentFragment();
      for (let i = 0; i < count; i++) {
        fragment.appendChild(this.createSkeletonMessage());
      }
      this.chatContainer.appendChild(fragment);
    },

    hideLoading() {
      if (this.hasLoaded) return;

      const skeletons = this.chatContainer.querySelectorAll('.skeleton-message');
      skeletons.forEach(skeleton => {
        skeleton.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => skeleton.remove(), 300);
      });

      this.hasLoaded = true;
    }
  };

  // Initialize when document loads
  document.addEventListener('DOMContentLoaded', () => {
    skeletonLoader.init();
    skeletonLoader.showInitialLoading(10);

    // Maximum loading time of 10 seconds
    setTimeout(() => {
      if (!skeletonLoader.hasLoaded) {
        skeletonLoader.hideLoading();
      }
    }, 10000);
  });