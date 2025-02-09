const profileSkeletonLoader = {
  init() {
    this.container = document.querySelector('.container');
    if (!this.container) return;
    
    // Store original content
    this.originalContent = this.container.innerHTML;
    
    // Hide original content immediately
    this.container.style.display = 'none';
    
    this.addStyles();
    this.showSkeleton();
    
    // Listen for Firebase data load
    document.addEventListener('profileDataLoaded', () => {
      this.showContent();
    });

    // Fallback timeout
    this.timeout = setTimeout(() => {
      this.showContent();
    }, 10000);
  },

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .shimmer-effect {
        position: relative;
        overflow: hidden;
      }

      .shimmer-effect::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 50%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(255, 255, 255, 0.25) 25%,
          rgba(255, 255, 255, 0.65) 50%,
          rgba(255, 255, 255, 0.25) 75%,
          transparent 100%
        );
        animation: shimmerLoading 2s infinite;
        transform: skewX(-20deg);
      }

      @keyframes shimmerLoading {
        0% {
          left: -100%;
        }
        100% {
          left: 200%;
        }
      }

      .single-shimmer {
        position: relative;
        overflow: hidden;
      }

      .single-shimmer::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 50%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(255, 255, 255, 0.2) 10%,
          rgba(255, 255, 255, 0.8) 50%,
          rgba(255, 255, 255, 0.2) 90%,
          transparent 100%
        );
        animation: singleShimmer 1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        transform: skewX(-12deg);
        pointer-events: none;
        z-index: 1000;
      }

      @keyframes singleShimmer {
        0% {
          left: -100%;
        }
        100% {
          left: 200%;
        }
      }

      .skeleton {
        position: relative;
        overflow: hidden;
        background: var(--bg-light);
        box-shadow: var(--shadow-light-outer);
      }

      .skeleton-container {
        background: var(--primary-light);
        border-radius: 20px;
        overflow: hidden;
        padding: 20px;
      }

      .skeleton-profile-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 20px;
        width: 100%;
      }

      .skeleton-image-container {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        margin-bottom: 20px;
      }

      .skeleton-camera {
        width: 35px;
        height: 35px;
        border-radius: 50%;
        position: absolute;
        bottom: 5px;
        right: 5px;
      }

      .skeleton-name {
        width: 180px;
        height: 24px;
        border-radius: 6px;
        margin: 10px 0;
      }

      .skeleton-email {
        width: 220px;
        height: 18px;
        border-radius: 4px;
        margin: 5px 0;
      }

      .skeleton-stats {
        display: flex;
        justify-content: center;
        gap: 30px;
        margin: 15px 0;
        width: 100%;
      }

      .skeleton-stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 80px;
      }

      .skeleton-stat-number {
        width: 40px;
        height: 24px;
        border-radius: 4px;
        margin-bottom: 5px;
      }

      .skeleton-stat-label {
        width: 60px;
        height: 16px;
        border-radius: 4px;
      }

      .skeleton-bio {
        width: 90%;
        height: 80px;
        border-radius: 10px;
        margin: 15px auto;
      }

      .skeleton-section {
        background: var(--bg-light);
        border-radius: 15px;
        padding: 15px;
        margin-bottom: 20px;
        box-shadow: var(--shadow-light-outer);
      }

      .skeleton-section-title {
        width: 140px;
        height: 24px;
        border-radius: 6px;
        margin-bottom: 15px;
      }

      .skeleton-section-item {
        display: flex;
        align-items: center;
        padding: 12px;
        background: var(--bg-light);
        border-radius: 10px;
        margin-bottom: 10px;
        box-shadow: var(--shadow-light-inner);
      }

      .skeleton-icon {
        width: 24px;
        height: 24px;
        border-radius: 6px;
        margin-right: 15px;
      }

      .skeleton-text {
        flex-grow: 1;
        height: 20px;
        border-radius: 4px;
      }

      .skeleton-toggle {
        width: 60px;
        height: 30px;
        border-radius: 15px;
      }

      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }

      .skeleton-hide {
        animation: fadeOut 0.3s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
  },

  createSection(itemCount) {
    const items = Array(itemCount).fill('').map(() => `
      <div class="skeleton-section-item shimmer-effect">
        <div class="skeleton skeleton-icon"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-toggle"></div>
      </div>
    `).join('');

    return `
      <div class="skeleton-section">
        <div class="skeleton skeleton-section-title"></div>
        ${items}
      </div>
    `;
  },

  showSkeleton() {
    const skeletonHTML = `
      <div class="skeleton-container">
        <div class="skeleton-profile-header">
          <div class="skeleton skeleton-image-container shimmer-effect">
            <div class="skeleton skeleton-camera"></div>
          </div>
          <div class="skeleton skeleton-name shimmer-effect"></div>
          <div class="skeleton skeleton-email shimmer-effect"></div>
          
          <div class="skeleton-stats">
            <div class="skeleton-stat">
              <div class="skeleton skeleton-stat-number shimmer-effect"></div>
              <div class="skeleton skeleton-stat-label shimmer-effect"></div>
            </div>
            <div class="skeleton-stat">
              <div class="skeleton skeleton-stat-number shimmer-effect"></div>
              <div class="skeleton skeleton-stat-label shimmer-effect"></div>
            </div>
          </div>
          
          <div class="skeleton skeleton-bio shimmer-effect"></div>
        </div>

        ${this.createSection(3)}
        ${this.createSection(2)}
        ${this.createSection(2)}
        ${this.createSection(3)}
      </div>
    `;

    const skeletonElement = document.createElement('div');
    skeletonElement.className = 'skeleton-wrapper';
    skeletonElement.innerHTML = skeletonHTML;
    
    this.container.insertAdjacentElement('beforebegin', skeletonElement);
  },

  showContent() {
    const skeletonWrapper = document.querySelector('.skeleton-wrapper');
    if (skeletonWrapper) {
      skeletonWrapper.classList.add('skeleton-hide');
      setTimeout(() => {
        skeletonWrapper.remove();
        this.container.style.display = '';
        // Add single shimmer effect after content loads
        this.container.classList.add('single-shimmer');
        // Remove the shimmer class after animation completes
        setTimeout(() => {
          this.container.classList.remove('single-shimmer');
        }, 1000); // matches animation duration
        clearTimeout(this.timeout);
      }, 300);
    }
  }
};

// Initialize immediately to show skeleton first
profileSkeletonLoader.init();

// Dispatch this event when your Firebase data loads:
// document.dispatchEvent(new Event('profileDataLoaded'));