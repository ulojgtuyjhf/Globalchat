
document.addEventListener("DOMContentLoaded", () => {
  // Add custom CSS for the verification badges
  const style = document.createElement("style");
  style.textContent = `
    .message-status {
      display: inline-flex;
      align-items: center;
      margin-left: 4px;
      height: 16px;
    }
    
    .verification-badge {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
      background: linear-gradient(135deg, #1DA1F2, #1a91da);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      margin-left: 3px;
      z-index: 1;
      transform-style: preserve-3d;
      perspective: 100px;
    }
    
    .verification-badge:before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
      background: linear-gradient(145deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 50%);
      z-index: 2;
    }
    
    .verification-badge:after {
      content: '';
      position: absolute;
      top: 1px;
      left: 1px;
      right: 1px;
      bottom: 1px;
      clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
      background: #1DA1F2;
      z-index: 1;
      filter: brightness(0.85);
    }
    
    .verification-badge svg {
      width: 7px;
      height: 7px;
      color: white;
      stroke: white;
      stroke-width: 2.5;
      fill: none;
      position: relative;
      z-index: 3;
      filter: drop-shadow(0 1px 0 rgba(0, 0, 0, 0.3));
    }
    
    /* Animation for the badge */
    .verification-badge {
      transform: scale(0) rotateY(0deg);
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    
    .verification-badge.animate {
      transform: scale(1) rotateY(0deg);
      opacity: 1;
    }
    
    /* Hover effect */
    .verification-badge:hover {
      transform: scale(1.15) rotateY(15deg);
    }
    
    /* Position it nicely near the username */
    .user-name {
      display: inline-flex;
      align-items: center;
    }
  `;
  document.head.appendChild(style);

  // Function to create verification badge element
  function createVerificationBadge() {
    const badgeContainer = document.createElement("div");
    badgeContainer.className = "message-status";
    badgeContainer.innerHTML = `
      <div class="verification-badge" title="Verified">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
    `;
    return badgeContainer;
  }

  // Add verification badges to all messages
  function addVerificationBadges() {
    document.querySelectorAll(".message .user-name").forEach(userName => {
      // Check if badge already exists to avoid duplicates
      if (!userName.nextElementSibling?.classList.contains("message-status")) {
        const badge = createVerificationBadge();
        userName.after(badge);
        
        // Animate the badge after a small delay
        setTimeout(() => {
          const badgeElement = badge.querySelector(".verification-badge");
          if (badgeElement) badgeElement.classList.add("animate");
        }, 50);
      }
    });
  }

  // Initial application of badges
  addVerificationBadges();

  // Observer to handle dynamically added messages
  const chatContainer = document.getElementById("chatContainer");
  const observer = new MutationObserver(() => {
    requestAnimationFrame(() => {
      addVerificationBadges();
    });
  });

  // Start observing the chat container for new messages
  observer.observe(chatContainer, { childList: true, subtree: true });
});
