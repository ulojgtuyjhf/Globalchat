// Enhanced URL detection and custom viewer with Instagram-style effects
function initializeUrlBeautifier() {
  // URL pattern for all domains
  const urlPattern = /(https?:\/\/[^\s<]+)/gi;

  // Create custom viewer with enhanced animations and Instagram-like UI
  function createCustomViewer(url) {
    const viewer = document.createElement('div');
    viewer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #fff;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
    `;

    // Add keyframe animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateY(100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      @media (max-width: 768px) {
        .header-controls {
          font-size: 14px;
        }
        .content-wrapper {
          padding: 12px;
        }
      }
    `;
    document.head.appendChild(style);

    // Enhanced header with Instagram-style design
    const header = document.createElement('div');
    header.style.cssText = `
      height: 56px;
      background: #fff;
      display: flex;
      align-items: center;
      padding: 0 16px;
      gap: 12px;
      box-shadow: 0 1px 0 rgba(0,0,0,0.1);
      position: relative;
      z-index: 1;
    `;

    // Animated close button (X)
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-width="2" d="M18 6L6 18M6 6l12 12"/>
      </svg>
    `;
    closeBtn.style.cssText = `
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      color: #000;
    `;
    closeBtn.onmouseover = () => {
      closeBtn.style.background = 'rgba(0,0,0,0.05)';
      closeBtn.style.transform = 'scale(1.1)';
    };
    closeBtn.onmouseout = () => {
      closeBtn.style.background = 'none';
      closeBtn.style.transform = 'scale(1)';
    };
    closeBtn.onclick = () => {
      viewer.style.animation = 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) reverse';
      setTimeout(() => viewer.remove(), 300);
    };

    // Security indicator with animation
    const security = document.createElement('div');
    const isSecure = url.startsWith('https://');
    security.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" 
           stroke="${isSecure ? '#00c853' : '#ff1744'}" stroke-width="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
      <span style="margin-left: 4px;">
        ${isSecure ? 'Secure' : 'Not Secure'}
      </span>
    `;
    security.style.cssText = `
      display: flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: 6px;
      background: ${isSecure ? 'rgba(0,200,83,0.1)' : 'rgba(255,23,68,0.1)'};
      color: ${isSecure ? '#00c853' : '#ff1744'};
      font-size: 12px;
      font-weight: 500;
    `;

    // URL display
    const urlDisplay = document.createElement('div');
    urlDisplay.textContent = new URL(url).hostname;
    urlDisplay.style.cssText = `
      color: #000;
      font-size: 16px;
      font-weight: 600;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    `;

    // Loading spinner
    const spinner = document.createElement('div');
    spinner.style.cssText = `
      width: 24px;
      height: 24px;
      border: 2px solid #eee;
      border-top-color: #000;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    `;

    // Content wrapper
    const contentWrapper = document.createElement('div');
    contentWrapper.style.cssText = `
      flex: 1;
      position: relative;
      overflow: hidden;
      background: #fff;
    `;

    // Create iframe for content
    const content = document.createElement('iframe');
    content.src = url;
    content.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      opacity: 0;
      transition: opacity 0.3s;
    `;

    // Handle iframe load events and errors
    content.onload = () => {
      spinner.remove();
      content.style.opacity = '1';
    };

    content.onerror = () => {
      handleLoadError();
    };

    // Error handling function
    function handleLoadError() {
      spinner.remove();
      const errorMsg = document.createElement('div');
      errorMsg.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        color: #666;
      `;
      errorMsg.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12" y2="16"/>
        </svg>
        <p style="margin-top: 16px; font-size: 16px;">Unable to load content</p>
        <button style="
          margin-top: 12px;
          padding: 8px 16px;
          background: #000;
          color: #fff;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
        ">Open in new tab</button>
      `;
      
      errorMsg.querySelector('button').onclick = () => {
        window.open(url, '_blank');
      };
      
      contentWrapper.appendChild(errorMsg);
    }

    // Assemble viewer
    header.appendChild(closeBtn);
    header.appendChild(security);
    header.appendChild(urlDisplay);
    contentWrapper.appendChild(spinner);
    contentWrapper.appendChild(content);
    viewer.appendChild(header);
    viewer.appendChild(contentWrapper);
    document.body.appendChild(viewer);

    // Add keyboard shortcut to close (Escape key)
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeBtn.click();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  // Enhanced URL styling
  function styleUrls(element) {
    const text = element.innerHTML;
    const styledText = text.replace(urlPattern, (url) => {
      return `<a href="#" 
              onclick="event.preventDefault(); this.getRootNode().defaultView.createCustomViewer('${url}')" 
              style="
                color: #fff;
                background: #000;
                padding: 4px 12px;
                border-radius: 8px;
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                gap: 6px;
                font-weight: 500;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              "
              onmouseover="
                this.style.transform='translateY(-2px)';
                this.style.boxShadow='0 6px 12px rgba(0,0,0,0.3)';
              "
              onmouseout="
                this.style.transform='translateY(0)';
                this.style.boxShadow='0 2px 8px rgba(0,0,0,0.2)';
              "
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
              </svg>
              ${new URL(url).hostname}
            </a>`;
    });

    if (text !== styledText) {
      element.innerHTML = styledText;
    }
  }

  // Watch for new messages
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) {
          const messageContent = node.querySelector('.message-content p');
          if (messageContent) {
            styleUrls(messageContent);
          }
        }
      });
    });
  });

  // Start observing chat container
  const chatContainer = document.querySelector('.chat-container');
  observer.observe(chatContainer, {
    childList: true,
    subtree: true
  });

  // Make createCustomViewer available globally
  window.createCustomViewer = createCustomViewer;
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', initializeUrlBeautifier);