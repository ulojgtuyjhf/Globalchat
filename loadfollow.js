
function setupFollowButtonEnhancements() {
  // Create and inject the improved CSS styles
  const followLoaderStyle = document.createElement('style');
  followLoaderStyle.textContent = `
    @keyframes spin-animation {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @keyframes pulse-opacity {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
    
    .follow-btn {
      background-color: var(--primary, #1d9bf0);
      color: white;
      border: none;
      border-radius: 9999px;
      padding: 5px 10px;
      font-size: 11px;
      font-weight: bold;
      cursor: pointer;
      outline: none;
      transition: background-color 0.2s, color 0.2s, border 0.2s;
      position: relative;
    }
    
    .follow-btn.followed {
      background-color: transparent;
      color: var(--primary, #1d9bf0);
      border: 1px solid var(--primary, #1d9bf0);
    }
    
    .follow-btn.loading {
      pointer-events: none;
    }
    
    .follow-btn .spinner {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 14px;
      height: 14px;
      display: none;
    }
    
    .follow-btn.loading .spinner {
      display: block;
    }
    
    .follow-btn.loading span {
      visibility: hidden;
    }
    
    .spinner::after {
      content: '';
      box-sizing: border-box;
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: var(--primary, #1d9bf0);
      animation: spin-animation 0.8s linear infinite;
    }
    
    .follow-btn.followed .spinner::after {
      border: 2px solid rgba(29, 155, 240, 0.2);
      border-top-color: var(--primary, #1d9bf0);
    }
  `;
  document.head.appendChild(followLoaderStyle);

  // Function to update primary color from localStorage
  function updatePrimaryColor() {
    const savedColorValue = localStorage.getItem('color-value');
    if (savedColorValue) {
      document.documentElement.style.setProperty('--primary', savedColorValue);
    }
  }

  // Initialize primary color
  updatePrimaryColor();

  // Listen for color changes
  window.addEventListener('storage', function(event) {
    if (event.key === 'color-value') {
      updatePrimaryColor();
    }
  });

  // Also listen for the custom event from the theme customizer
  window.addEventListener('chatColorChanged', function(event) {
    if (event.detail && event.detail.color) {
      document.documentElement.style.setProperty('--primary', event.detail.color);
    }
  });

  // Handle follow button clicks
  document.addEventListener('click', async (event) => {
    const followBtn = event.target.closest('.follow-btn');
    if (!followBtn) return;
    
    // Prevent default behavior
    event.preventDefault();
    event.stopImmediatePropagation();
    
    // Already loading, don't process multiple clicks
    if (followBtn.classList.contains('loading')) return;
    
    // Add loading state
    followBtn.classList.add('loading');
    
    // Create spinner if it doesn't exist
    if (!followBtn.querySelector('.spinner')) {
      const spinner = document.createElement('div');
      spinner.className = 'spinner';
      followBtn.appendChild(spinner);
    }
    
    try {
      // Extract and call the toggleFollow function
      const onclickAttr = followBtn.getAttribute('onclick');
      const match = onclickAttr.match(/toggleFollow\('(.+)', '(.+)'\)/);
      
      if (match) {
        const [_, userId, username] = match;
        await window.toggleFollow(userId, username);
      }
    } catch (error) {
      console.error('Follow operation failed:', error);
    } finally {
      // Update button state
      followBtn.classList.remove('loading');
      
      // Toggle followed state (if it's not already handled by the original toggleFollow function)
      // This is a fallback in case the original function doesn't update the UI
      setTimeout(() => {
        const currentState = followBtn.classList.contains('followed');
        if (followBtn.textContent.trim() !== (currentState ? 'Unfollow' : 'Follow')) {
          followBtn.textContent = currentState ? 'Unfollow' : 'Follow';
        }
      }, 100);
    }
  }, true);
}

// Initialize our enhancements
setupFollowButtonEnhancements();
