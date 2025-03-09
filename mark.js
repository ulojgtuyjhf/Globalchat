
document.addEventListener('DOMContentLoaded', () => {
  // Add CSS with checkmarks extremely close together
  const style = document.createElement('style');
  style.textContent = `
    .message-tick-status {
      position: absolute;
      bottom: 6px;
      right: 8px;
      height: 14px;
      display: flex;
      align-items: center;
    }
    
    .tick {
      width: 14px;
      height: 14px;
      transform-origin: center;
      opacity: 0;
    }
    
    .tick.second {
      margin-left: -10px; /* Much closer overlap */
      position: relative;
      z-index: 2;
    }
    
    .tick path {
      stroke: #1da1f2;
      stroke-width: 2.5;
      fill: none;
    }
    
    .tick.first {
      animation: tickAppear 0.3s forwards 0.1s;
    }
    
    .tick.second {
      animation: tickAppear 0.3s forwards 0.25s;
    }
    
    @keyframes tickAppear {
      0% { transform: scale(0); opacity: 0; }
      60% { transform: scale(1.3); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
    
    .message-content {
      position: relative;
    }
  `;
  document.head.appendChild(style);

  // Function to add ticks to messages
  function addMessageTicks() {
    document.querySelectorAll('.message-content').forEach(content => {
      // Only add if not already present
      if (!content.querySelector('.message-tick-status')) {
        const tickStatus = document.createElement('div');
        tickStatus.className = 'message-tick-status';
        tickStatus.innerHTML = `
          <svg class="tick first" viewBox="0 0 24 24">
            <path d="M5 13l5 5L20 7"></path>
          </svg>
          <svg class="tick second" viewBox="0 0 24 24">
            <path d="M5 13l5 5L20 7"></path>
          </svg>
        `;
        content.appendChild(tickStatus);
      }
    });
  }

  // Run immediately and set up observer
  addMessageTicks();
  
  const chatContainer = document.getElementById('chatContainer');
  if (chatContainer) {
    const observer = new MutationObserver(addMessageTicks);
    observer.observe(chatContainer, { childList: true, subtree: true });
  }
});
