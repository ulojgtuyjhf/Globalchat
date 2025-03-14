
// Dark Theme Toggle for Global Chat - Works across all pages including mobile.html

// Initialize theme
function initTheme() {
  // Check for saved theme preference
  const darkMode = localStorage.getItem('darkMode') === 'enabled';
  
  // Apply saved theme on page load
  if (darkMode) {
    applyDarkTheme();
  } else {
    applyLightTheme();
  }
  
  // Add observers to handle dynamically added elements
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.addedNodes.length) {
        const isDarkMode = localStorage.getItem('darkMode') === 'enabled';
        if (isDarkMode) {
          // Apply dark theme to any new elements
          applyDynamicDarkStyles(mutation.addedNodes);
        }
      }
    });
  });
  
  // Observe both chat messages and user list
  const chatContainer = document.getElementById('chatContainer') || document.getElementById('chat-container');
  if (chatContainer) {
    observer.observe(chatContainer, { 
      childList: true,
      subtree: true
    });
  }
  
  const userList = document.getElementById('userList');
  if (userList) {
    observer.observe(userList, { 
      childList: true,
      subtree: true
    });
  }
  
  // Monitor the dark mode setting from localStorage for cross-page sync
  window.addEventListener('storage', (event) => {
    if (event.key === 'darkMode') {
      if (event.newValue === 'enabled') {
        applyDarkTheme();
      } else {
        applyLightTheme();
      }
    }
  });
  
  // Set up dark mode toggle if it exists on the page
  const darkModeSwitch = document.getElementById('darkModeSwitch');
  if (darkModeSwitch) {
    darkModeSwitch.checked = darkMode;
    darkModeSwitch.addEventListener('change', () => {
      if (darkModeSwitch.checked) {
        localStorage.setItem('darkMode', 'enabled');
        applyDarkTheme();
      } else {
        localStorage.setItem('darkMode', 'disabled');
        applyLightTheme();
      }
    });
  }
}

// Apply dark theme to dynamically added elements
function applyDynamicDarkStyles(nodes) {
  nodes.forEach(node => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      // For chat messages
      if (node.classList && node.classList.contains('message')) {
        const messageBubble = node.querySelector('.message-bubble');
        if (messageBubble) {
          messageBubble.style.backgroundColor = '#132c3e';
          messageBubble.style.color = '#e7e9ea';
        }
        
        // Style username and timestamp for search.html
        const username = node.querySelector('.username');
        if (username) username.style.color = '#e7e9ea';
        
        const timestamp = node.querySelector('.timestamp');
        if (timestamp) timestamp.style.color = '#8b98a5';
      }
      
      // For user cards
      if (node.classList && node.classList.contains('user-card')) {
        node.style.borderBottom = '1px solid var(--border-color)';
      }
    }
  });
}

// Define dark theme CSS variables - updated to work for mobile.html, chat, user list, and search pages
function applyDarkTheme() {
  // Common variables
  document.documentElement.style.setProperty('--primary-color', '#1d9bf0');
  document.documentElement.style.setProperty('--primary-light', '#1a2634');
  document.documentElement.style.setProperty('--primary-dark', '#1a91da');
  document.documentElement.style.setProperty('--text-primary', '#e7e9ea');
  document.documentElement.style.setProperty('--text-secondary', '#8b98a5');
  document.documentElement.style.setProperty('--border-color', '#38444d');
  document.documentElement.style.setProperty('--box-shadow', '0 2px 10px rgba(0, 0, 0, 0.2)');
  
  // For chat pages
  document.documentElement.style.setProperty('--background-light', '#15202b');
  document.documentElement.style.setProperty('--background-white', '#1e2732');
  document.documentElement.style.setProperty('--border-light', '#38444d');
  
  // For count.html specific variables
  document.documentElement.style.setProperty('--bg-primary', '#15202b');
  document.documentElement.style.setProperty('--bg-secondary', '#1e2732');
  document.documentElement.style.setProperty('--hover-bg', 'rgba(29, 155, 240, 0.1)');
  document.documentElement.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.3)');
  
  // Update body background for all pages
  document.body.style.backgroundColor = '#15202b';
  document.body.style.color = '#e7e9ea';
  
  // Mobile.html specific styling
  const mobileMenu = document.querySelector('.mobile-menu');
  if (mobileMenu) {
    mobileMenu.style.backgroundColor = '#15202b';
    mobileMenu.style.borderBottom = '1px solid #38444d';
  }
  
  // Style mobile menu items
  document.querySelectorAll('.menu-item').forEach(item => {
    item.style.color = '#8b98a5';
  });
  
  document.querySelectorAll('.menu-item svg').forEach(svg => {
    svg.style.stroke = '#8b98a5';
  });
  
  document.querySelectorAll('.menu-item.active svg').forEach(svg => {
    svg.style.stroke = '#1d9bf0';
  });
  
  document.querySelectorAll('.menu-item:hover').forEach(item => {
    item.style.backgroundColor = 'rgba(29, 161, 242, 0.1)';
  });
  
  // Style content sections
  document.querySelectorAll('.section').forEach(section => {
    section.style.backgroundColor = '#15202b';
    section.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.2)';
  });
  
  // Style iframes
  document.querySelectorAll('iframe').forEach(iframe => {
    iframe.style.backgroundColor = '#15202b';
  });
  
  // Style loading indicators
  document.querySelectorAll('.spinner').forEach(spinner => {
    spinner.style.borderTopColor = '#1d9bf0';
    spinner.style.borderLeftColor = '#1d9bf0';
  });
  
  // Style error states
  document.querySelectorAll('.error-state').forEach(error => {
    error.style.color = '#e7e9ea';
  });
  
  document.querySelectorAll('.retry-button').forEach(button => {
    button.style.backgroundColor = '#1d9bf0';
    button.style.color = '#e7e9ea';
  });
  
  // Update specific elements for search.html
  document.querySelectorAll('.message-bubble').forEach(el => {
    el.style.backgroundColor = '#1e2732';
    el.style.color = '#e7e9ea';
    el.style.borderColor = '#38444d';
  });
  
  document.querySelectorAll('.username').forEach(el => {
    el.style.color = '#e7e9ea';
  });
  
  document.querySelectorAll('.timestamp').forEach(el => {
    el.style.color = '#8b98a5';
  });
  
  document.querySelectorAll('.reaction').forEach(el => {
    el.style.backgroundColor = '#1e2732';
    el.style.borderColor = '#38444d';
    if (!el.classList.contains('user-reacted')) {
      el.style.color = '#8b98a5';
    }
  });
  
  document.querySelectorAll('.add-reaction').forEach(el => {
    el.style.backgroundColor = '#1e2732';
    el.style.borderColor = '#38444d';
  });
  
  // Update chat messages (both for chat pages and search.html)
  document.querySelectorAll('.message.outgoing .message-content').forEach(el => {
    el.style.backgroundColor = '#132c3e';
  });
  
  // User list search
  const searchBox = document.querySelector('.twitter-search');
  if (searchBox) {
    searchBox.style.backgroundColor = '#1e2732';
    searchBox.style.border = '1px solid #38444d';
  }
  
  // Profile modal
  const profileContent = document.querySelector('.profile-content');
  if (profileContent) {
    profileContent.style.backgroundColor = '#15202b';
  }
  
  // Set background for skeleton loaders
  document.querySelectorAll('.skeleton').forEach(el => {
    el.style.backgroundColor = '#2c3640';
  });
  
  // Media modal for search.html
  const mediaModal = document.querySelector('.media-modal');
  if (mediaModal) {
    const mediaContent = mediaModal.querySelector('.media-content');
    if (mediaContent) {
      mediaContent.style.backgroundColor = '#15202b';
    }
  }
  
  // Add class to body for any global CSS targeting
  document.body.classList.add('dark-theme');
}

// Restore light theme CSS variables
function applyLightTheme() {
  // Common variables
  document.documentElement.style.setProperty('--primary-color', '#4a90e2');
  document.documentElement.style.setProperty('--primary-light', '#e0e7ff');
  document.documentElement.style.setProperty('--primary-dark', '#357abd');
  document.documentElement.style.setProperty('--text-primary', '#333');
  document.documentElement.style.setProperty('--text-secondary', '#666');
  document.documentElement.style.setProperty('--border-color', '#e0e7ff');
  document.documentElement.style.setProperty('--box-shadow', '0 2px 10px rgba(0, 0, 0, 0.05)');
  
  // For chat pages
  document.documentElement.style.setProperty('--background-light', '#f9f9f9');
  document.documentElement.style.setProperty('--background-white', '#ffffff');
  document.documentElement.style.setProperty('--border-light', '#e0e7ff');
  
  // For count.html specific variables
  document.documentElement.style.setProperty('--bg-primary', '#f9f9f9');
  document.documentElement.style.setProperty('--bg-secondary', '#ffffff');
  document.documentElement.style.setProperty('--hover-bg', 'rgba(74, 144, 226, 0.1)');
  document.documentElement.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.1)');
  
  // Restore body background for all pages
  document.body.style.backgroundColor = '#ffffff';
  document.body.style.color = '#0f1419';
  
  // Mobile.html specific styling
  const mobileMenu = document.querySelector('.mobile-menu');
  if (mobileMenu) {
    mobileMenu.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
    mobileMenu.style.borderBottom = '1px solid #efefef';
  }
  
  // Restore mobile menu items
  document.querySelectorAll('.menu-item').forEach(item => {
    item.style.color = '#666';
  });
  
  document.querySelectorAll('.menu-item svg').forEach(svg => {
    svg.style.stroke = '#666';
  });
  
  document.querySelectorAll('.menu-item.active svg').forEach(svg => {
    svg.style.stroke = '#1da1f2';
  });
  
  document.querySelectorAll('.menu-item:hover').forEach(item => {
    item.style.backgroundColor = 'rgba(29, 161, 242, 0.1)';
  });
  
  // Restore content sections
  document.querySelectorAll('.section').forEach(section => {
    section.style.backgroundColor = '#ffffff';
    section.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.02)';
  });
  
  // Restore iframes
  document.querySelectorAll('iframe').forEach(iframe => {
    iframe.style.backgroundColor = '#ffffff';
  });
  
  // Restore loading indicators
  document.querySelectorAll('.spinner').forEach(spinner => {
    spinner.style.borderTopColor = '#1da1f2';
    spinner.style.borderLeftColor = '#1da1f2';
  });
  
  // Restore error states
  document.querySelectorAll('.error-state').forEach(error => {
    error.style.color = '#333';
  });
  
  document.querySelectorAll('.retry-button').forEach(button => {
    button.style.backgroundColor = '#1da1f2';
    button.style.color = '#fff';
  });
  
  // Restore specific elements for search.html
  document.querySelectorAll('.message-bubble').forEach(el => {
    el.style.backgroundColor = '#f7f9fa';
    el.style.color = '#0f1419';
    el.style.borderColor = 'rgba(0, 0, 0, 0.05)';
  });
  
  document.querySelectorAll('.username').forEach(el => {
    el.style.color = '#0f1419';
  });
  
  document.querySelectorAll('.timestamp').forEach(el => {
    el.style.color = '#657786';
  });
  
  document.querySelectorAll('.reaction').forEach(el => {
    el.style.backgroundColor = '#ffffff';
    el.style.borderColor = 'rgba(0, 0, 0, 0.1)';
    if (!el.classList.contains('user-reacted')) {
      el.style.color = 'inherit';
    }
  });
  
  document.querySelectorAll('.add-reaction').forEach(el => {
    el.style.backgroundColor = '#ffffff';
    el.style.borderColor = 'rgba(0, 0, 0, 0.1)';
  });
  
  // Restore chat messages
  document.querySelectorAll('.message.outgoing .message-content').forEach(el => {
    el.style.backgroundColor = 'var(--primary-light)';
  });
  
  // User list search
  const searchBox = document.querySelector('.twitter-search');
  if (searchBox) {
    searchBox.style.backgroundColor = '#ffffff';
    searchBox.style.border = '1px solid transparent';
  }
  
  // Profile modal
  const profileContent = document.querySelector('.profile-content');
  if (profileContent) {
    profileContent.style.backgroundColor = '#f9f9f9';
  }
  
  // Restore background for skeleton loaders
  document.querySelectorAll('.skeleton').forEach(el => {
    el.style.backgroundColor = '#ffffff';
  });
  
  // Media modal for search.html
  const mediaModal = document.querySelector('.media-modal');
  if (mediaModal) {
    const mediaContent = mediaModal.querySelector('.media-content');
    if (mediaContent) {
      mediaContent.style.backgroundColor = '#ffffff';
    }
  }
  
  // Remove dark theme class from body
  document.body.classList.remove('dark-theme');
}

// Run once DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTheme);
} else {
  initTheme();
}
