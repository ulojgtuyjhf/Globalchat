
(function() {
  // Super comprehensive URL regex that catches virtually any web address format
  const urlRegex = /((?:(?:https?|ftp):\/\/)?(?:www\.)?(?:[a-zA-Z0-9][-a-zA-Z0-9]*[a-zA-Z0-9]\.)+(?:com|org|edu|gov|uk|net|ca|de|jp|fr|au|us|ru|ch|it|nl|se|no|es|io|co|ai|dev|ly|app|me|tv|info|xyz|[a-z]{2,})(?:\/[-a-zA-Z0-9()@:%_\+.~#?&//=]*)?)/gi;

  // CSS for modern link styling and modal popup with dark/light theme support
  const styles = `
    /* Link styling */
    .chat-link {
      color: var(--link-color, #1da1f2);
      text-decoration: none;
      word-break: break-all;
      border-bottom: 1px dotted var(--link-underline-color, rgba(29, 161, 242, 0.5));
      transition: all 0.15s ease;
      cursor: pointer;
      padding: 0 2px;
      margin: 0 -2px;
      border-radius: 2px;
    }
    .chat-link:hover {
      color: var(--link-hover-color, #0c7abf);
      background-color: var(--link-hover-bg, rgba(29, 161, 242, 0.1));
      border-bottom: 1px solid var(--link-color, #1da1f2);
      text-decoration: none;
    }
    
    /* Theme variables - Light Theme (Default) */
    :root {
      --link-color: #1da1f2;
      --link-hover-color: #0c7abf;
      --link-underline-color: rgba(29, 161, 242, 0.5);
      --link-hover-bg: rgba(29, 161, 242, 0.1);
      --modal-bg: white;
      --modal-text: #14171a;
      --modal-secondary-text: #657786;
      --modal-border: rgba(0, 0, 0, 0.08);
      --modal-url-bg: #f5f8fa;
      --button-color: #1da1f2;
      --button-hover-bg: rgba(29, 161, 242, 0.1);
      --button-primary-bg: #1da1f2;
      --button-primary-hover-bg: #1a91da;
      --button-primary-text: white;
      --toast-bg: #17bf63;
      --toast-text: white;
      --overlay-bg: rgba(0, 0, 0, 0.6);
      --handle-color: #cfd9de;
      --handle-hover-color: #1da1f2;
    }
    
    /* Dark Theme Variables */
    body.dark-mode {
      --link-color: #1da1f2;
      --link-hover-color: #4db5f5;
      --link-underline-color: rgba(29, 161, 242, 0.5);
      --link-hover-bg: rgba(29, 161, 242, 0.15);
      --modal-bg: #15202b;
      --modal-text: #f7f9f9;
      --modal-secondary-text: #8899a6;
      --modal-border: rgba(255, 255, 255, 0.1);
      --modal-url-bg: #1c2732;
      --button-color: #1da1f2;
      --button-hover-bg: rgba(29, 161, 242, 0.15);
      --button-primary-bg: #1da1f2;
      --button-primary-hover-bg: #1a91da;
      --button-primary-text: white;
      --toast-bg: #17bf63;
      --toast-text: white;
      --overlay-bg: rgba(0, 0, 0, 0.75);
      --handle-color: #38444d;
      --handle-hover-color: #1da1f2;
    }
    
    /* Modal overlay */
    .link-confirm-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: var(--overlay-bg);
      z-index: 10000;
      display: flex;
      justify-content: center;
      align-items: flex-end;
      animation: fadeIn 0.2s ease-out;
    }
    
    /* Modal dialog */
    .link-confirm-modal {
      background-color: var(--modal-bg);
      border-radius: 16px 16px 0 0;
      box-shadow: 0 -5px 20px rgba(0, 0, 0, 0.2);
      max-width: 500px;
      width: 100%;
      overflow: hidden;
      animation: slideUp 0.3s ease-out;
      position: relative;
      touch-action: none;
      transform: translateY(0);
      transition: transform 0.2s ease;
    }
    
    /* Drag handle for modal */
    .link-confirm-drag-handle {
      position: absolute;
      top: 8px;
      left: 50%;
      transform: translateX(-50%);
      width: 40px;
      height: 5px;
      border-radius: 999px;
      background-color: var(--handle-color);
      cursor: grab;
      transition: background-color 0.2s;
    }
    
    .link-confirm-drag-handle:hover {
      background-color: var(--handle-hover-color);
    }
    
    /* Modal header */
    .link-confirm-header {
      padding: 24px 16px 12px;
      display: flex;
      align-items: center;
      border-bottom: 1px solid var(--modal-border);
    }
    
    .link-confirm-logo {
      width: 28px;
      height: 28px;
      margin-right: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background-color: var(--button-color);
      color: var(--button-primary-text);
      font-weight: 700;
      font-size: 16px;
    }
    
    .link-confirm-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--modal-text);
    }
    
    /* Modal content */
    .link-confirm-content {
      padding: 16px;
    }
    
    .link-confirm-warning {
      margin-bottom: 16px;
      color: var(--modal-secondary-text);
      font-size: 15px;
      line-height: 1.5;
    }
    
    .link-confirm-url-container {
      background-color: var(--modal-url-bg);
      border-radius: 12px;
      padding: 12px;
      margin-bottom: 16px;
      overflow: hidden;
      word-break: break-all;
    }
    
    .link-confirm-url {
      font-size: 14px;
      color: var(--modal-text);
      line-height: 1.4;
    }
    
    /* Modal actions */
    .link-confirm-actions {
      padding: 0 16px 24px;
      display: flex;
      gap: 12px;
    }
    
    .link-confirm-btn {
      flex: 1;
      background-color: transparent;
      border: 1px solid var(--button-color);
      color: var(--button-color);
      font-weight: 600;
      font-size: 15px;
      padding: 12px 0;
      border-radius: 9999px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .link-confirm-btn:hover {
      background-color: var(--button-hover-bg);
    }
    
    .link-confirm-btn.primary {
      background-color: var(--button-primary-bg);
      color: var(--button-primary-text);
    }
    
    .link-confirm-btn.primary:hover {
      background-color: var(--button-primary-hover-bg);
    }
    
    /* Success notification */
    .link-copied-toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #1da1f2;
      color: var(--toast-text);
      padding: 10px 18px;
      border-radius: 9999px;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10001;
      animation: toastIn 0.3s ease-out, toastOut 0.3s ease-in 2.7s forwards;
    }
    
    /* Animations */
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    
    @keyframes toastIn {
      from { transform: translate(-50%, 20px); opacity: 0; }
      to { transform: translate(-50%, 0); opacity: 1; }
    }
    
    @keyframes toastOut {
      from { transform: translate(-50%, 0); opacity: 1; }
      to { transform: translate(-50%, 20px); opacity: 0; }
    }
  `;

  // Add styles to document
  function addStyles() {
    if (document.getElementById('chat-link-styles')) return;
    const styleElement = document.createElement('style');
    styleElement.id = 'chat-link-styles';
    styleElement.textContent = styles;
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

  // Function to make an element draggable
  function enableDragging(modalElement, handleElement, overlayElement) {
    let startY = 0;
    let startTranslateY = 0;
    let isDragging = false;
    let didMove = false;
    let modalHeight = modalElement.offsetHeight;
    
    // Make entire modal draggable
    modalElement.addEventListener('mousedown', startDrag);
    modalElement.addEventListener('touchstart', startDrag, { passive: true });
    
    function startDrag(e) {
      // Only capture touch on the drag handle or any part of the modal
      startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
      startTranslateY = getTranslateY(modalElement);
      isDragging = true;
      didMove = false;
      modalHeight = modalElement.offsetHeight;
      
      document.addEventListener('mousemove', drag);
      document.addEventListener('touchmove', drag, { passive: false });
      document.addEventListener('mouseup', endDrag);
      document.addEventListener('touchend', endDrag);
    }
    
    function drag(e) {
      if (!isDragging) return;
      
      e.preventDefault();
      
      const currentY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
      const deltaY = currentY - startY;
      
      // Only allow dragging downward
      if (deltaY < 0) return;
      
      didMove = true;
      
      // Apply transform
      modalElement.style.transform = `translateY(${deltaY}px)`;
      
      // Adjust overlay opacity based on drag progress
      const progress = Math.min(deltaY / modalHeight, 1);
      overlayElement.style.opacity = 1 - progress * 0.5;
    }
    
    function endDrag() {
      if (!isDragging) return;
      
      isDragging = false;
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('touchmove', drag);
      document.removeEventListener('mouseup', endDrag);
      document.removeEventListener('touchend', endDrag);
      
      const currentTranslateY = getTranslateY(modalElement);
      
      // If dragged more than 30% of the modal height, close the modal
      if (currentTranslateY > modalHeight * 0.3) {
        modalElement.style.transform = `translateY(${modalHeight}px)`;
        overlayElement.style.opacity = '0';
        
        setTimeout(() => {
          if (overlayElement.parentNode) {
            overlayElement.parentNode.removeChild(overlayElement);
          }
        }, 300);
      } else {
        // Otherwise, snap back to original position
        modalElement.style.transform = '';
        overlayElement.style.opacity = '';
      }
    }
    
    // Helper function to get current translateY value
    function getTranslateY(element) {
      const style = window.getComputedStyle(element);
      const transform = style.transform || style.webkitTransform;
      
      if (transform === 'none') return 0;
      
      const matrix = transform.match(/matrix.*\((.+)\)/)[1].split(', ');
      return parseFloat(matrix[5]) || 0;
    }
  }

  // Function to show confirmation modal
  function showLinkConfirmation(url) {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'link-confirm-overlay';
    
    // Create modal dialog
    const modal = document.createElement('div');
    modal.className = 'link-confirm-modal';
    
    // Add drag handle
    const dragHandle = document.createElement('div');
    dragHandle.className = 'link-confirm-drag-handle';
    modal.appendChild(dragHandle);
    
    // Create custom header with logo
    const header = document.createElement('div');
    header.className = 'link-confirm-header';
    header.innerHTML = `
      <div class="link-confirm-logo">N</div>
      <div class="link-confirm-title">Link destination</div>
    `;
    
    // Create content
    const content = document.createElement('div');
    content.className = 'link-confirm-content';
    
    // Format URL for display
    let displayUrl = url;
    if (displayUrl.length > 50) {
      displayUrl = displayUrl.substring(0, 47) + '...';
    }
    
    content.innerHTML = `
      <div class="link-confirm-warning">
        This link will take you to an external website. Please verify it's safe before proceeding.
      </div>
      <div class="link-confirm-url-container">
        <div class="link-confirm-url">${displayUrl}</div>
      </div>
    `;
    
    // Create actions
    const actions = document.createElement('div');
    actions.className = 'link-confirm-actions';
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'link-confirm-btn';
    copyBtn.textContent = 'Copy link';
    copyBtn.onclick = () => {
      // Copy to clipboard
      navigator.clipboard.writeText(url).then(() => {
        // Show success toast
        const toast = document.createElement('div');
        toast.className = 'link-copied-toast';
        toast.textContent = 'Link copied to clipboard';
        document.body.appendChild(toast);
        
        // Remove toast after animation
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 3000);
      });
      
      // Close modal
      document.body.removeChild(overlay);
    };
    
    const openBtn = document.createElement('button');
    openBtn.className = 'link-confirm-btn primary';
    openBtn.textContent = 'Open link';
    openBtn.onclick = () => {
      // Open link
      window.open(url, '_blank', 'noopener,noreferrer');
      
      // Close modal
      document.body.removeChild(overlay);
    };
    
    actions.appendChild(copyBtn);
    actions.appendChild(openBtn);
    
    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(content);
    modal.appendChild(actions);
    overlay.appendChild(modal);
    
    // Add to document
    document.body.appendChild(overlay);
    
    // Enable dragging
    enableDragging(modal, dragHandle, overlay);
    
    // Close on click outside modal (but not when touching the modal itself)
    overlay.addEventListener('mousedown', (event) => {
      if (event.target === overlay) {
        document.body.removeChild(overlay);
      }
    });
    
    // Close on escape key
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        document.body.removeChild(overlay);
        document.removeEventListener('keydown', escHandler);
      }
    });
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
        
        // Show confirmation dialog
        showLinkConfirmation(url);
      }
    });
  }

  // Theme management functions
  function initializeThemeManagement() {
    // Check if dark mode is enabled in localStorage
    const isDarkMode = localStorage.getItem('darkMode') === 'enabled';
    
    // Apply theme based on localStorage
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    
    // Find the dark mode toggle switch in settings
    const darkModeSwitch = document.getElementById('darkModeSwitch');
    
    if (darkModeSwitch) {
      // Set initial state based on the theme
      if (isDarkMode) {
        darkModeSwitch.classList.add('active');
      } else {
        darkModeSwitch.classList.remove('active');
      }
      
      // We don't need to add event listener here since it's already handled in the settings page
      // But we'll observe changes to the switch to keep our script in sync
      
      // Create observer for the switch state
      const switchObserver = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          if (mutation.attributeName === 'class') {
            const isActive = darkModeSwitch.classList.contains('active');
            
            // Update body class to match switch state
            if (isActive) {
              document.body.classList.add('dark-mode');
            } else {
              document.body.classList.remove('dark-mode');
            }
          }
        });
      });
      
      // Start observing the toggle switch
      switchObserver.observe(darkModeSwitch, { attributes: true });
    }
    
    // Also listen for localStorage changes (for cross-tab synchronization)
    window.addEventListener('storage', event => {
      if (event.key === 'darkMode') {
        if (event.newValue === 'enabled') {
          document.body.classList.add('dark-mode');
          if (darkModeSwitch) {
            darkModeSwitch.classList.add('active');
          }
        } else {
          document.body.classList.remove('dark-mode');
          if (darkModeSwitch) {
            darkModeSwitch.classList.remove('active');
          }
        }
      }
    });
  }

  // Initialize everything
  function init() {
    // Add the CSS
    addStyles();
    
    // Initialize theme management
    initializeThemeManagement();
    
    // Set up the observer
    observeChat();
    
    // Handle link clicks
    setupLinkHandler();
    
    // Periodically check for new messages (as a fallback)
    setInterval(processAllMessages, 1000);
    
    console.log("Link safety dialog initialized with theme support from localStorage");
  }

  // Run the initializer
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
