document.addEventListener('DOMContentLoaded', () => {
    // Create scroll-to-bottom button
    const scrollButton = document.createElement('button');
    scrollButton.innerHTML = '↓'; // Simple, clean down arrow
    scrollButton.id = 'scrollToBottomBtn';
    scrollButton.classList.add('scroll-to-bottom-btn');

    // Comprehensive styling for the button
    const style = document.createElement('style');
    style.textContent = `
    .scroll-to-bottom-btn {
      position: fixed;
      bottom: 80px;
      right: 20px;
      width: 45px;
      height: 45px;
      background: white;
      color: black;
      border: 2px solid rgba(0,0,0,0.1);
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 
        0 4px 6px rgba(0,0,0,0.1),
        0 1px 3px rgba(0,0,0,0.08);
      z-index: 1000;
      font-size: 24px;
      font-weight: bold;
      display: none; /* Initially hidden */
      align-items: center;
      justify-content: center;
      outline: none;
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .scroll-to-bottom-btn.visible {
      display: flex;
      opacity: 1;
      transform: translateY(0);
    }
    
    .scroll-to-bottom-btn:hover {
      transform: scale(1.1);
      box-shadow: 
        0 6px 8px rgba(0,0,0,0.15),
        0 2px 4px rgba(0,0,0,0.12);
    }
    
    .scroll-to-bottom-btn:active {
      transform: scale(0.95);
      box-shadow: 
        0 2px 4px rgba(0,0,0,0.1);
    }
  `;
    document.head.appendChild(style);

    // Append button to body
    document.body.appendChild(scrollButton);

    // Reference to chat container
    const chatContainer = document.getElementById('chatContainer');

    // Function to check scroll position and toggle button visibility
    function checkScrollPosition() {
      if (!chatContainer) return;

      // Calculate how far from the bottom we are
      const distanceFromBottom =
        chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight;

      // Show button when scrolled up significantly (more than 200px from bottom)
      if (distanceFromBottom > 200) {
        scrollButton.classList.add('visible');
      } else {
        scrollButton.classList.remove('visible');
      }
    }

    // Smooth scroll to bottom function
    function scrollToBottom() {
      if (!chatContainer) return;

      chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: 'smooth'
      });
    }

    // Add event listeners
    if (chatContainer) {
      chatContainer.addEventListener('scroll', checkScrollPosition);
    }

    scrollButton.addEventListener('click', scrollToBottom);

    // Initial check
    checkScrollPosition();
  });