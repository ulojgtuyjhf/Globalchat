function initializeUrlBeautifier() {
  const urlPattern = /(https?:\/\/[^\s<]+?(?:\.com|\.org|\.net|\.edu|\.gov|\.io|\.app)[^\s<]*)/gi;
  
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
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
    `;
    document.head.appendChild(style);
    
    const header = document.createElement('div');
    header.style.cssText = `
      height: 60px;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      padding: 0 16px;
      gap: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.1);
      border-bottom: 1px solid rgba(0,0,0,0.1);
    `;
    
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
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      color: #333;
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
    
    const security = document.createElement('div');
    const isSecure = url.startsWith('https://');
    security.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" 
           stroke="${isSecure ? '#00c853' : '#ff1744'}" stroke-width="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
      <span style="margin-left: 4px;">
        ${isSecure ? 'Secure Connection' : 'Not Secure'}
      </span>
    `;
    security.style.cssText = `
      display: flex;
      align-items: center;
      padding: 6px 12px;
      border-radius: 8px;
      background: ${isSecure ? 'rgba(0,200,83,0.1)' : 'rgba(255,23,68,0.1)'};
      color: ${isSecure ? '#00c853' : '#ff1744'};
      font-size: 12px;
      font-weight: 500;
      transition: all 0.3s;
      animation: pulse 2s infinite;
    `;
    
    const urlDisplay = document.createElement('div');
    urlDisplay.textContent = url;
    urlDisplay.style.cssText = `
      color: #333;
      font-size: 14px;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      padding: 8px 12px;
      border-radius: 6px;
      background: linear-gradient(90deg, 
        rgba(0,0,0,0.03) 25%, 
        rgba(0,0,0,0.05) 50%, 
        rgba(0,0,0,0.03) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 3s infinite linear;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      flex: 1;
      width: 100%;
      overflow-y: auto;
      padding: 16px;
      background: #f9f9f9;
    `;
    
    // Fetch content using a proxy
    fetch(`https://cors-anywhere.herokuapp.com/${url}`)
      .then(response => response.text())
      .then(html => {
        content.innerHTML = html;
      })
      .catch(error => {
        content.innerHTML = `<p style="color: #ff1744;">Unable to load content: ${error.message}</p>`;
      });
    
    header.appendChild(closeBtn);
    header.appendChild(security);
    header.appendChild(urlDisplay);
    viewer.appendChild(header);
    viewer.appendChild(content);
    document.body.appendChild(viewer);
  }
  
  function styleUrls(element) {
    const text = element.innerHTML;
    const styledText = text.replace(urlPattern, (url) => {
      return `<a href="#" 
              onclick="event.preventDefault(); this.getRootNode().defaultView.createCustomViewer('${url}')" 
              style="
                color: #fff;
                background: linear-gradient(135deg, #000, #333);
                padding: 4px 12px;
                border-radius: 8px;
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                gap: 6px;
                font-weight: 500;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                transform-style: preserve-3d;
                perspective: 1000px;
              "
              onmouseover="
                this.style.transform='translateY(-2px) rotateX(5deg)';
                this.style.boxShadow='0 6px 12px rgba(0,0,0,0.4)';
              "
              onmouseout="
                this.style.transform='translateY(0) rotateX(0)';
                this.style.boxShadow='0 2px 8px rgba(0,0,0,0.3)';
              "
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
              </svg>
              ${url}
            </a>`;
    });
    
    if (text !== styledText) {
      element.innerHTML = styledText;
    }
  }
  
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
  
  const chatContainer = document.querySelector('.chat-container');
  observer.observe(chatContainer, {
    childList: true,
    subtree: true
  });
  
  window.createCustomViewer = createCustomViewer;
}

document.addEventListener('DOMContentLoaded', initializeUrlBeautifier);