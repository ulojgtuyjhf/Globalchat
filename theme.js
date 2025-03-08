
// Dark Theme Toggle for Global Chat - Connected to Profile Settings

// Initialize theme
function initTheme() {
  // Don't create a new toggle button - use the existing one from profile view
  const existingToggle = document.getElementById('darkModeSwitch');
  
  // Check for saved theme preference from profile settings
  const darkMode = localStorage.getItem('darkMode') === 'enabled';
  
  // Apply saved theme
  if (darkMode) {
    applyDarkTheme();
  }
  
  // We don't need to add a click event listener since the profile page already has one
  // Just make sure our theme functions get called when the toggle changes
  
  // Add observers to handle dynamically added messages
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.addedNodes.length) {
        const isDarkMode = localStorage.getItem('darkMode') === 'enabled';
        if (isDarkMode) {
          mutation.addedNodes.forEach(node => {
            if (node.classList && node.classList.contains('message') && node.classList.contains('outgoing')) {
              const content = node.querySelector('.message-content');
              if (content) content.style.backgroundColor = '#132c3e';
            }
          });
        }
      }
    });
  });
  
  // Start observing for new messages if we're on the chat page
  const chatContainer = document.getElementById('chatContainer');
  if (chatContainer) {
    observer.observe(chatContainer, { 
      childList: true,
      subtree: true
    });
  }
  
  // Monitor the dark mode setting from localStorage
  window.addEventListener('storage', (event) => {
    if (event.key === 'darkMode') {
      if (event.newValue === 'enabled') {
        applyDarkTheme();
      } else {
        applyLightTheme();
      }
    }
  });
}

// Define dark theme CSS variables - updated to match profile view storage format
function applyDarkTheme() {
  document.documentElement.style.setProperty('--primary-color', '#1d9bf0'); // Twitter blue
  document.documentElement.style.setProperty('--primary-light', '#1a2634');
  document.documentElement.style.setProperty('--primary-dark', '#1a91da');
  document.documentElement.style.setProperty('--text-primary', '#e7e9ea');
  document.documentElement.style.setProperty('--text-secondary', '#8b98a5');
  document.documentElement.style.setProperty('--background-light', '#15202b'); // Twitter dark blue
  document.documentElement.style.setProperty('--background-white', '#1e2732');
  document.documentElement.style.setProperty('--border-light', '#38444d');
  document.documentElement.style.setProperty('--box-shadow', '0 2px 10px rgba(0, 0, 0, 0.2)');
  
  // Update message styles
  document.querySelectorAll('.message.outgoing .message-content').forEach(el => {
    el.style.backgroundColor = '#132c3e'; // Darker blue for outgoing messages
  });
}

// Restore light theme CSS variables
function applyLightTheme() {
  document.documentElement.style.setProperty('--primary-color', '#4a90e2');
  document.documentElement.style.setProperty('--primary-light', '#e0e7ff');
  document.documentElement.style.setProperty('--primary-dark', '#357abd');
  document.documentElement.style.setProperty('--text-primary', '#333');
  document.documentElement.style.setProperty('--text-secondary', '#666');
  document.documentElement.style.setProperty('--background-light', '#f9f9f9');
  document.documentElement.style.setProperty('--background-white', '#ffffff');
  document.documentElement.style.setProperty('--border-light', '#e0e7ff');
  document.documentElement.style.setProperty('--box-shadow', '0 2px 10px rgba(0, 0, 0, 0.05)');
  
  // Restore message styles
  document.querySelectorAll('.message.outgoing .message-content').forEach(el => {
    el.style.backgroundColor = 'var(--primary-light)';
  });
}

// Run once DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTheme);
} else {
  initTheme();
}
