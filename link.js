

// Link Detection and Conversion Script
(function() {
  // URL regex pattern that matches common URL formats
  const urlRegex = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;

  // CSS for link styling
  const linkStyles = `
    .chat-link {
      color: #1da1f2;
      text-decoration: none;
      word-break: break-all;
      border-bottom: 1px dotted #1da1f2;
      transition: color 0.2s, border-bottom 0.2s;
    }
    .chat-link:hover {
      color: #0c7abf;
      border-bottom: 1px solid #0c7abf;
    }
  `;

  // Add styles to document
  function addStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = linkStyles;
    document.head.appendChild(styleElement);
  }

  // Function to convert text URLs to clickable links
  function linkify(text) {
    if (!text) return text;
    return text.replace(urlRegex, function(url) {
      // Ensure URL has proper protocol
      let href = url;
      if (!href.match(/^https?:\/\//i)) {
        href = 'http://' + href;
      }
      return `<a href="${href}" class="chat-link" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
  }

  // Process existing messages
  function processExistingMessages() {
    const messageTextElements = document.querySelectorAll('.message-text');
    messageTextElements.forEach(element => {
      if (!element.dataset.linkified) {
        element.innerHTML = linkify(element.innerHTML);
        element.dataset.linkified = 'true';
      }
    });
  }

  // Process new messages as they're added
  function observeNewMessages() {
    const chatContainer = document.getElementById('chatContainer');
    
    if (!chatContainer) return;
    
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // Element node
              const messageTextElements = node.querySelectorAll('.message-text');
              messageTextElements.forEach(element => {
                if (!element.dataset.linkified) {
                  element.innerHTML = linkify(element.innerHTML);
                  element.dataset.linkified = 'true';
                }
              });
            }
          });
        }
      });
    });
    
    // Configure and start the observer
    observer.observe(chatContainer, { childList: true, subtree: true });
  }

  // Handle click events on links to open in browser
  function handleLinkClicks() {
    document.addEventListener('click', function(event) {
      if (event.target.classList.contains('chat-link')) {
        event.preventDefault();
        
        // Open link in user's browser
        window.open(event.target.href, '_blank');
      }
    });
  }

  // Initialize the script
  function init() {
    // Add styles first
    addStyles();
    
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        processExistingMessages();
        observeNewMessages();
        handleLinkClicks();
      });
    } else {
      processExistingMessages();
      observeNewMessages();
      handleLinkClicks();
    }
  }

  // Start the script
  init();
})();
