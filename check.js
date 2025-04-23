
(function() {
  // Use IIFE to avoid global scope pollution
  const verificationBadgeInit = () => {
    // Create SVG namespace for proper SVG creation
    const svgNS = "http://www.w3.org/2000/svg";
    
    // Add custom CSS for the verification badges using a unique class prefix
    const styleEl = document.createElement("style");
    styleEl.textContent = `
      .vb-message-status {
        display: inline-flex;
        align-items: center;
        margin-left: 4px;
        height: 16px;
      }
      
      .vb-badge {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        margin-left: 3px;
        z-index: 1;
      }
      
      /* Animation for the badge */
      .vb-badge {
        transform: scale(0);
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      
      .vb-badge.animate {
        transform: scale(1);
        opacity: 1;
      }
      
      /* Hover effect */
      .vb-badge:hover {
        transform: scale(1.15);
      }
      
      /* Position it nicely near the username */
      .user-name {
        display: inline-flex;
        align-items: center;
      }
    `;
    document.head.appendChild(styleEl);

    // Function to create Twitter-like verification badge with star/offer icon
    function createVerificationBadge() {
      const badgeContainer = document.createElement("div");
      badgeContainer.className = "vb-message-status";
      
      const badgeWrapper = document.createElement("div");
      badgeWrapper.className = "vb-badge";
      badgeWrapper.setAttribute("title", "Verified");
      
      // Create SVG element properly
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("width", "16");
      svg.setAttribute("height", "16");
      svg.setAttribute("viewBox", "0 0 122.88 122.88");
      
      // Create star/offer icon path
      const starPath = document.createElementNS(svgNS, "path");
      starPath.setAttribute("d", "M13.7,49.54,8,33.63a3.47,3.47,0,0,1,2.1-4.44,3.93,3.93,0,0,1,.81-.18L27.3,27.3,29,10.79a3.47,3.47,0,0,1,3.81-3.1,2.9,2.9,0,0,1,.71.15l16,4.11L58.8,1.21A3.49,3.49,0,0,1,63.7.83a3.91,3.91,0,0,1,.61.68l9,12.17,15.91-5.8A3.48,3.48,0,0,1,93.69,10a3.44,3.44,0,0,1,.19.83l1.7,16.51L112.09,29a3.47,3.47,0,0,1,2.71,5.09l-7.3,13.77,14,10.83a3.46,3.46,0,0,1,.62,4.87,3.18,3.18,0,0,1-.72.7L109.2,73.33,115,89.24a3.48,3.48,0,0,1-2.08,4.45,3.44,3.44,0,0,1-.83.19l-16.51,1.7L93.88,112a3.48,3.48,0,0,1-3.81,3.1,3.61,3.61,0,0,1-1.27-.38L75,107.49l-10.85,14a3.46,3.46,0,0,1-5.57-.1l-9.08-12.25-15.91,5.74A3.47,3.47,0,0,1,29,112.05L27.3,97.29,10.53,93.82a3.46,3.46,0,0,1-2.7-4.09A2.62,2.62,0,0,1,8,89.11L13.7,73.34,1.4,64.23a3.48,3.48,0,0,1-.72-4.86,3.42,3.42,0,0,1,.77-.75L13.7,49.54Zm62.39-6.2L55.66,78.86a6.86,6.86,0,0,1-.67,1,2.76,2.76,0,0,1-.82.71,3.14,3.14,0,0,1-1.1.31,10.25,10.25,0,0,1-1.31.07H47.9a1.16,1.16,0,0,1-1.16-1.15,1.18,1.18,0,0,1,.21-.67L67.39,43.57a7.2,7.2,0,0,1,.65-1l0-.06a2.84,2.84,0,0,1,.78-.65A3.15,3.15,0,0,1,70,41.59h0a10,10,0,0,1,1.29-.07h3.85a1.16,1.16,0,0,1,1.16,1.15,1.18,1.18,0,0,1-.21.67Zm-7.4,36.07c-1.72-1.8-2.59-4.56-2.59-8.28s.87-6.48,2.59-8.28,4.52-2.7,8.4-2.7,6.68.9,8.4,2.7,2.58,4.56,2.58,8.28-.86,6.48-2.58,8.28-4.52,2.7-8.4,2.7-6.68-.9-8.4-2.7Zm6-11.44v8h1.3a16.21,16.21,0,0,0,3.27-.26c.22-.18.33-.67.33-1.46v-8h-3a3,3,0,0,0-1.58.26c-.21.18-.32.67-.32,1.46ZM37.39,60q-2.58-2.7-2.58-8.28t2.58-8.28q2.58-2.7,8.4-2.7t8.4,2.7q2.58,2.7,2.58,8.28T54.19,60q-2.58,2.7-8.4,2.7T37.39,60Zm6-11.44v8h3a2.93,2.93,0,0,0,1.57-.27c.22-.18.33-.67.33-1.46v-8H46.93a15.28,15.28,0,0,0-3.26.27c-.22.17-.33.66-.33,1.45ZM16,35.46l5,14a3.48,3.48,0,0,1-1.14,4.13L9.3,61.44,19.9,69.3a3.48,3.48,0,0,1,1.2,4L15.84,87.84,31,91a3.48,3.48,0,0,1,3,3.05l1.49,12.9,14.05-5.06A3.47,3.47,0,0,1,53.59,103l7.91,10.68,9.74-12.61A3.48,3.48,0,0,1,75.69,100l11.81,6.21L89,92.1A3.47,3.47,0,0,1,92.06,89L107,87.43,101.8,73.32a3.46,3.46,0,0,1,1.18-4l10.67-7.92-12.52-9.67A3.5,3.5,0,0,1,100,47.18l6.26-11.8L92.1,33.93A3.48,3.48,0,0,1,89,30.82L87.43,15.93,73.32,21.08a3.48,3.48,0,0,1-4-1.18L61.24,9l-7.8,9.07a3.48,3.48,0,0,1-3.5,1.1L35.5,15.5,33.92,30.78a3.47,3.47,0,0,1-3.1,3.14L16,35.46Z");
      starPath.setAttribute("fill", "#1DA1F2");  // Twitter blue color
      
      // Append elements
      svg.appendChild(starPath);
      badgeWrapper.appendChild(svg);
      badgeContainer.appendChild(badgeWrapper);
      
      return badgeContainer;
    }

    // Add verification badges to all messages
    function addVerificationBadges() {
      document.querySelectorAll(".message .user-name").forEach(userName => {
        // Check if badge already exists to avoid duplicates
        if (!userName.nextElementSibling?.classList.contains("vb-message-status")) {
          const badge = createVerificationBadge();
          userName.after(badge);
          
          // Animate the badge after a small delay
          setTimeout(() => {
            const badgeElement = badge.querySelector(".vb-badge");
            if (badgeElement) badgeElement.classList.add("animate");
          }, 50);
        }
      });
    }

    // Initial application of badges
    addVerificationBadges();

    // Observer to handle dynamically added messages
    const chatContainer = document.getElementById("chatContainer");
    if (chatContainer) {
      const observer = new MutationObserver(() => {
        requestAnimationFrame(() => {
          addVerificationBadges();
        });
      });

      // Start observing the chat container for new messages
      observer.observe(chatContainer, { childList: true, subtree: true });
    } else {
      // If chatContainer doesn't exist yet, try to find it after a delay
      setTimeout(() => {
        const delayedChatContainer = document.getElementById("chatContainer") || 
                                     document.querySelector(".chat-container") || 
                                     document.querySelector(".message-list");
        if (delayedChatContainer) {
          const observer = new MutationObserver(() => {
            requestAnimationFrame(() => {
              addVerificationBadges();
            });
          });
          observer.observe(delayedChatContainer, { childList: true, subtree: true });
          addVerificationBadges();
        }
      }, 1000);
    }
  };

  // Run when DOM is fully loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", verificationBadgeInit);
  } else {
    // DOM is already ready
    verificationBadgeInit();
  }
})();
