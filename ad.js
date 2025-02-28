
(function() {
  // Detect if user prefers dark mode
  const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
  let isDarkMode = prefersDarkScheme.matches;
  
  // Auto dark mode between 8PM and 6AM if no system preference
  if (!prefersDarkScheme.matches) {
    const currentHour = new Date().getHours();
    isDarkMode = (currentHour >= 20 || currentHour < 6);
  }
  
  // Theme colors
  const theme = {
    background: "#15202b",
    text: "#ffffff",
    secondaryText: "#8899a6",
    border: "#38444d",
    inputBackground: "#253341",
    messageHover: "#192734"
  };
  
  // Apply dark theme
  function applyDarkTheme() {
    // Set body styles
    document.body.style.backgroundColor = theme.background;
    document.body.style.color = theme.text;
    
    // Update chat container
    const chatContainer = document.querySelector('.chat-container');
    if (chatContainer) {
      chatContainer.style.backgroundColor = theme.background;
    }
    
    // Update input container
    const inputContainer = document.querySelector('.input-container');
    if (inputContainer) {
      inputContainer.style.backgroundColor = theme.background;
      inputContainer.style.borderTopColor = theme.border;
    }
    
    // Update input wrapper
    const inputWrapper = document.querySelector('.input-wrapper');
    if (inputWrapper) {
      inputWrapper.style.backgroundColor = theme.inputBackground;
    }
    
    // Update message text areas
    const textareas = document.querySelectorAll('.message-textarea, .reply-textarea');
    textareas.forEach(textarea => {
      textarea.style.color = theme.text;
    });
    
    // Update message elements
    const messages = document.querySelectorAll('.message');
    messages.forEach(message => {
      message.style.borderBottomColor = theme.border;
    });
    
    // Update message meta info
    const metaTexts = document.querySelectorAll('.user-handle, .message-time');
    metaTexts.forEach(text => {
      text.style.color = theme.secondaryText;
    });
    
    // Update action buttons
    const actionButtons = document.querySelectorAll('.action-button');
    actionButtons.forEach(button => {
      button.style.color = theme.secondaryText;
    });
  }
  
  // Apply theme based on detected preference
  if (isDarkMode) {
    applyDarkTheme();
  }
  
  // Listen for new messages to apply theme
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList' && isDarkMode) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1 && node.classList?.contains('message')) {
            node.style.borderBottomColor = theme.border;
            
            // Update text colors in the new message
            const metaTexts = node.querySelectorAll('.user-handle, .message-time');
            metaTexts.forEach(text => {
              text.style.color = theme.secondaryText;
            });
            
            const actionButtons = node.querySelectorAll('.action-button');
            actionButtons.forEach(button => {
              button.style.color = theme.secondaryText;
            });
          }
        });
      }
    }
  });
  
  // Start observing the chat container for added messages
  const chatContainer = document.querySelector('.chat-container');
  if (chatContainer) {
    observer.observe(chatContainer, { childList: true });
  }
  
  // Listen for system preference changes
  prefersDarkScheme.addEventListener('change', e => {
    isDarkMode = e.matches;
    if (isDarkMode) {
      applyDarkTheme();
    } else {
      // Reload page to restore default light theme
      window.location.reload();
    }
  });
})();
