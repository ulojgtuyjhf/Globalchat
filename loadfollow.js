(function() {
  // Create unique namespace to avoid conflicts
  const NanoFollowButton = {
    init: function() {
      const styleEl = document.createElement('style');
      styleEl.textContent = `
        @keyframes nano-follow-spin {
          to { transform: rotate(360deg); }
        }

        @keyframes nano-follow-rainbow {
          0% { border-top-color: #ff0000; }
          16.666% { border-top-color: #ff8000; }
          33.333% { border-top-color: #ffff00; }
          50% { border-top-color: #00ff00; }
          66.666% { border-top-color: #0000ff; }
          83.333% { border-top-color: #8000ff; }
          100% { border-top-color: #ff0000; }
        }

        .nano-follow-btn.loading {
          position: relative;
          padding-right: 32px !important;
        }

        .nano-follow-btn.loading span {
          visibility: hidden;
        }

        .nano-follow-btn.loading::after {
          content: '';
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid rgba(0, 0, 0, 0.1);
          border-top: 2px solid #333;
          animation: 
            nano-follow-spin 0.8s linear infinite,
            nano-follow-rainbow 2s linear infinite;
          background: #f0f0f0;
          transform-origin: center center;
          pointer-events: none;
        }

        .nano-follow-btn.followed.loading::after {
          background: #e8e8e8;
        }
      `;
      document.head.appendChild(styleEl);
    },

    handleClick: async function(event) {
      const button = event.target.closest('.nano-follow-btn');
      if (!button) return;

      event.preventDefault();
      event.stopPropagation();

      // Store original dimensions
      const rect = button.getBoundingClientRect();
      const originalWidth = rect.width;
      const originalHeight = rect.height;

      // Fix dimensions to prevent layout shift
      button.style.width = originalWidth + 'px';
      button.style.height = originalHeight + 'px';
      button.classList.add('loading');

      // Store original text
      const originalText = button.textContent;
      const span = document.createElement('span');
      span.textContent = originalText;
      button.innerHTML = '';
      button.appendChild(span);

      try {
        const onClickAttr = button.getAttribute('onclick');
        const matches = onClickAttr?.match(/toggleFollow\('(.+)', '(.+)'\)/);
        
        if (matches) {
          const [_, param1, param2] = matches;
          await window.toggleFollow(param1, param2);
        }
      } catch (error) {
        console.error('Follow operation failed:', error);
      } finally {
        // Restore button state
        button.classList.remove('loading');
        button.style.width = '';
        button.style.height = '';
        button.innerHTML = button.classList.contains('followed') ? 'Unfollow' : 'Follow';
      }
    }
  };

  // Initialize
  NanoFollowButton.init();

  // Add event listener with namespace
  document.addEventListener('click', NanoFollowButton.handleClick, true);
})();