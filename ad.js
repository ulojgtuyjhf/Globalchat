// Ad Configuration
const AD_KEYWORDS = {
  "default": {
    template: "premium_ad",
    url: "https://premiumfari.com",
    bg: "https://picsum.photos/400/200?modern",
    duration: 30,
    keywords: [
      "tech", "gadget", "phone", "laptop", "computer",
      "fashion", "style", "clothing", "shoes", "accessories",
      "travel", "vacation", "holiday", "trip", "destination",
      "food", "restaurant", "dining", "recipe", "cooking",
      "fitness", "health", "workout", "exercise", "wellness"
    ]
  }
};

// Ad Display System
(function() {
  const activeAds = new Map();

  function createSkeleton() {
    const skeleton = document.createElement('div');
    skeleton.className = 'ad-skeleton';
    skeleton.innerHTML = `
      <div class="skeleton-shine"></div>
      <div class="skeleton-content">
        <div class="skeleton-header">
          <div class="skeleton-label"></div>
          <div class="skeleton-timestamp"></div>
        </div>
        <div class="skeleton-image"></div>
        <div class="skeleton-text-container">
          <div class="skeleton-text-line"></div>
          <div class="skeleton-text-line"></div>
        </div>
        <div class="skeleton-cta"></div>
      </div>
    `;
    return skeleton;
  }

  function openInNativeBrowser(adData) {
    window.open(adData.url, '_blank', 'noopener,noreferrer');
  }

  function createAdElement(adData) {
    const ad = document.createElement('div');
    ad.className = `message ad ${adData.template}`;
    ad.innerHTML = `
      <div class="message-header">
        <div class="ad-label">
          <span class="sponsored-tag">
            <span class="sponsored-pulse"></span>
            featured
          </span>
          <span class="ad-timer">${adData.duration}s</span>
        </div>
        <button class="dismiss-btn" aria-label="Dismiss ad">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
      <div class="ad-content">
        <div class="ad-image-container">
          <div class="ad-image" style="background-image: url('${adData.bg}')">
            <div class="image-overlay"></div>
            <div class="power-lines"></div>
          </div>
        </div>
        <div class="ad-footer">
          <div class="premium-badge">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
            </svg>
            <span>Amazon</span>
          </div>
          <h3 class="ad-title">available in South Africa </h3>
          <p class="ad-description">shop now with Amazon and enjoy next day delivery.</p>
          <button class="ad-cta">
            <span>shop now!</span>
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
            </svg>
            <div class="cta-highlight"></div>
          </button>
        </div>
      </div>
    `;

    let remaining = adData.duration;
    const timer = ad.querySelector('.ad-timer');
    const countdown = setInterval(() => {
      remaining--;
      timer.textContent = `${remaining}s`;
      if (remaining <= 0) {
        ad.classList.add('ad-exit');
        setTimeout(() => {
          ad.remove();
        }, 300);
        clearInterval(countdown);
      }
    }, 1000);

    ad.querySelector('.dismiss-btn').onclick = (e) => {
      e.stopPropagation();
      ad.classList.add('ad-exit');
      setTimeout(() => {
        ad.remove();
      }, 300);
      clearInterval(countdown);
    };

    const handleClick = (e) => {
      e.stopPropagation();
      openInNativeBrowser(adData);
    };

    ad.querySelector('.ad-cta').onclick = handleClick;
    ad.querySelector('.ad-content').onclick = handleClick;

    return ad;
  }

  function insertAd(targetMessage, adData) {
    const skeleton = createSkeleton();
    targetMessage.after(skeleton);

    setTimeout(() => {
      skeleton.replaceWith(createAdElement(adData));
    }, 10000);
  }

  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.classList?.contains('message')) {
          const messageText = node.textContent.toLowerCase();
          const defaultAd = AD_KEYWORDS.default;

          if (defaultAd.keywords.some(keyword => messageText.includes(keyword))) {
            insertAd(node, defaultAd);
          }
        }
      });
    });
  });

  observer.observe(document.getElementById('chatContainer'), {
    childList: true,
    subtree: true
  });
})();

// Complete Styles
const adStyles = `
.message.ad {
  margin: 15px 0;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  animation: adEntry 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12),
              0 2px 6px rgba(0, 0, 0, 0.08),
              inset 0 1px 1px rgba(255, 255, 255, 0.8);
  transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.message.ad:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.16),
              0 4px 8px rgba(0, 0, 0, 0.1),
              inset 0 1px 1px rgba(255, 255, 255, 0.8);
}

.message.ad::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, 
    rgba(255,255,255,0) 0%,
    rgba(255,255,255,0.8) 50%,
    rgba(255,255,255,0) 100%);
}

@keyframes adEntry {
  0% { 
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  100% { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.ad-exit {
  animation: adExit 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

@keyframes adExit {
  to { 
    opacity: 0;
    transform: translateY(-20px);
  }
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
}

.sponsored-tag {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #536471;
  font-weight: 500;
}

.sponsored-pulse {
  width: 6px;
  height: 6px;
  background: #1a1a1a;
  border-radius: 50%;
  margin-right: 8px;
  position: relative;
}

.sponsored-pulse::after {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border-radius: 50%;
  background: #1a1a1a;
  opacity: 0.4;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.4;
  }
  70% {
    transform: scale(2);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

.ad-timer {
  margin-left: 12px;
  font-size: 13px;
  color: #536471;
  font-weight: 400;
}

.dismiss-btn {
  background: transparent;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.dismiss-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.dismiss-btn svg {
  fill: #536471;
}

.power-lines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    rgba(255, 255, 255, 0.03) 10px,
    rgba(255, 255, 255, 0.03) 20px
  );
  pointer-events: none;
}

.ad-content {
  cursor: pointer;
  padding: 0;
}

.ad-image-container {
  position: relative;
  overflow: hidden;
}

.ad-image {
  height: 260px;
  background-size: cover;
  background-position: center;
  transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    180deg,
    rgba(0,0,0,0) 0%,
    rgba(0,0,0,0.1) 100%
  );
  transition: opacity 0.3s ease;
}

.ad-content:hover .ad-image {
  transform: scale(1.05);
}

.ad-footer {
  padding: 16px;
}

.premium-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #1a1a1a;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 12px;
  opacity: 0.9;
  transition: opacity 0.3s ease;
}

.premium-badge svg {
  animation: starRotate 4s linear infinite;
}

@keyframes starRotate {
  0% { transform: rotate(0deg); }
  25% { transform: rotate(5deg); }
  75% { transform: rotate(-5deg); }
  100% { transform: rotate(0deg); }
}

.ad-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f1419;
  margin: 0 0 8px 0;
}

.ad-description {
  font-size: 14px;
  color: #536471;
  margin: 0 0 16px 0;
  line-height: 1.4;
}

.ad-cta {
  background: linear-gradient(135deg, #1a1a1a 0%, #000000 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 24px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.ad-cta:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3),
              0 0 0 2px rgba(0, 0, 0, 0.1),
              inset 0 0 20px rgba(255, 255, 255, 0.2);
  background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
}

.ad-cta:active {
  transform: translateY(1px) scale(0.98);
}

.cta-highlight {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  animation: shimmerButton 2s infinite;
  pointer-events: none;
}

@keyframes shimmerButton {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.ad-skeleton {
  background: #ffffff;
  border-radius: 16px;
  margin: 15px 0;
  padding: 16px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.skeleton-shine {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0) 0%,
    rgba(255,255,255,0.8) 50%,
    rgba(255,255,255,0) 100%
  );
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}

.skeleton-content > div {
  background: #f0f3f5;
  border-radius: 4px;
}

.skeleton-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.skeleton-label {
  height: 14px;
  width: 80px;
}

.skeleton-timestamp {
  height: 14px;
  width: 40px;
}

.skeleton-image {
  height: 240px;
  margin: 16px 0;
  border-radius: 8px;
}

.skeleton-text-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.skeleton-text-line {
  height: 16px;
}

.skeleton-text-line:first-child {
  width: 70%;
}

.skeleton-text-line:last-child {
  width: 50%;
}

.skeleton-cta {
  height: 40px;
  width: 120px;
  border-radius: 20px;
}
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = adStyles;
document.head.appendChild(styleSheet); 