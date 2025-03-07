// Dark Theme Toggle for Global Chat

// Create theme toggle button
function createThemeToggle() {
  const toggle = document.createElement('button');
  toggle.id = 'theme-toggle';
  toggle.innerHTML = '🌙'; // Moon emoji for dark mode toggle
  toggle.title = 'Toggle Dark Mode';
  
  // Style the toggle button
  toggle.style.position = 'fixed';
  toggle.style.top = '20px';
  toggle.style.right = '300px';
  toggle.style.zIndex = '1000';
  toggle.style.width = '30px';
  toggle.style.height = '30px';
  toggle.style.borderRadius = '50%';
  toggle.style.border = 'none';
  toggle.style.backgroundColor = 'var(--primary-light)';
  toggle.style.color = 'var(--primary-color)';
  toggle.style.fontSize = '20px';
  toggle.style.cursor = 'pointer';
  toggle.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
  toggle.style.transition = 'all 0.3s ease';
  
  // Add hover effect
  toggle.onmouseenter = () => {
    toggle.style.transform = 'scale(1.1)';
  };
  
  toggle.onmouseleave = () => {
    toggle.style.transform = 'scale(1)';
  };
  
  document.body.appendChild(toggle);
  return toggle;
}

// Define dark theme CSS variables
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
  
  // Update toggle icon
  const toggle = document.getElementById('theme-toggle');
  if (toggle) toggle.innerHTML = '☀️'; // Sun emoji for light mode toggle
  
  // Store preference
  localStorage.setItem('darkMode', 'true');
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
  
  // Update toggle icon
  const toggle = document.getElementById('theme-toggle');
  if (toggle) toggle.innerHTML = '🌙'; // Moon emoji for dark mode toggle
  
  // Store preference
  localStorage.setItem('darkMode', 'false');
}

// Initialize theme
function initTheme() {
  // Create toggle button
  const themeToggle = createThemeToggle();
  
  // Check for saved theme preference
  const darkMode = localStorage.getItem('darkMode') === 'true';
  
  // Apply saved theme or default to light
  if (darkMode) {
    applyDarkTheme();
  }
  
  // Add toggle event listener
  themeToggle.addEventListener('click', () => {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
      applyLightTheme();
    } else {
      applyDarkTheme();
    }
  });
  
  // Add observers to handle dynamically added messages
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.addedNodes.length) {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
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
  
  // Start observing for new messages
  observer.observe(document.getElementById('chatContainer'), { 
    childList: true,
    subtree: true
  });
  
  // Add media query for system preference
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
  
  // Initial check if no preference saved
  if (localStorage.getItem('darkMode') === null && prefersDarkScheme.matches) {
    applyDarkTheme();
  }
  
  // Listen for changes to system preferences
  prefersDarkScheme.addEventListener('change', e => {
    // Only apply if user hasn't set a preference
    if (localStorage.getItem('darkMode') === null) {
      if (e.matches) {
        applyDarkTheme();
      } else {
        applyLightTheme();
      }
    }
  });
}

// Run once DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTheme);
} else {
  initTheme();
}
