
// Ultimate Link Detection and Conversion Script
(function() {
  // Super comprehensive URL regex that catches virtually any web address format
  const urlRegex = /((?:(?:https?|ftp):\/\/)?(?:www\.)?(?:[a-zA-Z0-9][-a-zA-Z0-9]*[a-zA-Z0-9]\.)+(?:com|org|edu|gov|uk|net|ca|de|jp|fr|au|us|ru|ch|it|nl|se|no|es|io|co|ai|dev|ly|app|me|tv|info|xyz|[a-z]{2,})(?:\/[-a-zA-Z0-9()@:%_\+.~#?&//=]*)?)/gi;

  // CSS for stylish Twitter-like link styling
  const linkStyles = `
    .chat-link {
      color: #1da1f2;
      text-decoration: none;
      word-break: break-all;
      border-bottom: 1px dotted rgba(29, 161, 242, 0.5);
      transition: all 0.15s ease;
      cursor: pointer;
      padding: 0 2px;
      margin: 0 -2px;
      border-radius: 2px;
    }
    .chat-link:hover {
      color: #0c7abf;
      background-color: rgba(29, 161, 242, 0.1);
      border-bottom: 1px solid #1da1f2;
      text-decoration: none;
    }
  `;

  // Add styles to document
  function addStyles() {
    if (document.getElementById('chat-link-styles')) return;
    const styleElement = document.createElement('style');
    styleElement.id = 'chat-link-styles';
    styleElement.textContent = linkStyles;
    document.head.appendChild(styleElement);
  }

  // Function to convert text URLs to clickable links
  function linkify(text) {
    if (!text) return text;
    
    let html = text;
    
    // Replace URLs with anchor tags
    html = html.replace(urlRegex, function(match) {
      // Ensure URL has proper protocol for the href attribute
      let url = match;
      let href = match;
      
      if (!href.match(/^https?:\/\//i)) {
        href = 'http://' + href;
      }
      
      return `<a href="${href}" class="chat-link" target="_blank">${url}</a>`;
    });
    
    return html;
  }

  // Process message content
  function processMessageContent(element) {
    if (!element || element.dataset.linkified === 'true') return;
    
    // Save original text content
    const originalText = element.textContent;
    
    // Apply link detection
    element.innerHTML = linkify(originalText);
    
    // Mark as processed
    element.dataset.linkified = 'true';
  }

  // Process all messages in the chat
  function processAllMessages() {
    document.querySelectorAll('.message-text').forEach(processMessageContent);
  }

  // Set up mutation observer to catch new messages
  function observeChat() {
    // First process existing messages
    processAllMessages();
    
    // Then set up observer for new content
    const chatContainer = document.getElementById('chatContainer');
    if (!chatContainer) return;
    
    // Create new observer if it doesn't exist
    if (!window.linkifyObserver) {
      window.linkifyObserver = new MutationObserver(mutations => {
        let shouldProcess = false;
        
        // Check if any relevant elements were added
        mutations.forEach(mutation => {
          if (mutation.type === 'childList' && mutation.addedNodes.length) {
            shouldProcess = true;
          }
        });
        
        // Process all messages if needed
        if (shouldProcess) {
          processAllMessages();
        }
      });
      
      // Start observing the chat container
      window.linkifyObserver.observe(chatContainer, { 
        childList: true, 
        subtree: true 
      });
    }
  }

  // Handle clicks on links
  function setupLinkHandler() {
    // Use event delegation
    document.body.addEventListener('click', event => {
      let target = event.target;
      
      // Check if we clicked on a link
      if (target.classList.contains('chat-link')) {
        event.preventDefault();
        
        // Get the URL from the href
        const url = target.getAttribute('href');
        
        // Open in a new window/tab
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    });
  }

  // Initialize everything
  function init() {
    // Add the CSS
    addStyles();
    
    // Set up the observer
    observeChat();
    
    // Handle link clicks
    setupLinkHandler();
    
    // Periodically check for new messages (as a fallback)
    setInterval(processAllMessages, 1000);
  }

  // Run the initializer
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
