
(function() {
  // Enhanced Global Chat Theme Manager with Perfect Theme Integration
  const GlobalChatThemeManager = {
    themeConfig: {
      light: {
        // Core Colors
        '--primary-color': '#626262',
        '--primary-light': '#f0f0f0',
        '--primary-dark': '#3a3a3a',
        '--text-primary': '#333',
        '--text-secondary': '#666',
        '--background-light': '#f9f9f9',
        '--background-white': '#ffffff',
        '--border-light': '#e0e0e0',
        '--border-color': '#dadada',
        '--box-shadow': '0 2px 10px rgba(0, 0, 0, 0.05)',
        
        // Preserve the luxury gradient
        '--luxury-gradient': 'linear-gradient(135deg, #0f0f0f 0%, #1c1c1c 15%, #3a3a3a 30%, #4d4d4d 45%, #626262 60%, #787878 75%, #8f8f8f 90%, #a6a6a6 100%)',
        
        // Interactive states
        '--message-hover': '#f8f8f8',
        '--outgoing-hover': '#e5e5e5',
        '--image-hover': 'brightness(1.05)',
        '--follow-button-text': '#ffffff',
        
        // Glass effect
        '--glass-background': 'rgba(255, 255, 255, 0.9)',
        '--glass-blur': 'blur(8px)',
        '--glass-input': 'rgba(240, 240, 240, 0.8)',
        '--glass-input-focus': 'rgba(255, 255, 255, 0.95)',
        
        // Media container
        '--media-background': '#000000',
        '--media-gradient': 'rgba(0, 0, 0, 0.02) 0%, rgba(0, 0, 0, 0) 20%, rgba(0, 0, 0, 0) 80%, rgba(0, 0, 0, 0.02) 100%',
        '--post-description-bg': 'rgba(0, 0, 0, 0.7)',
        '--post-description-color': 'white',
        
        // Comments
        '--comment-fade-from': 'rgba(0, 0, 0, 0)',
        '--comment-fade-to': 'rgba(0, 0, 0, 0.05)',
        
        // Interactive buttons
        '--button-hover': 'rgba(0, 0, 0, 0.05)',
        '--heart-color': '#ff3040',
        '--heart-color-hover': '#ff3040'
      },
      
      dim: {
        // Core Colors
        '--primary-color': '#8899a6',
        '--primary-light': '#1e2732',
        '--primary-dark': '#667787',
        '--text-primary': '#ffffff',
        '--text-secondary': '#8899a6',
        '--background-light': '#15202b',
        '--background-white': '#1e2732',
        '--border-light': '#38444d',
        '--border-color': '#38444d',
        '--box-shadow': '0 2px 10px rgba(0, 0, 0, 0.2)',
        
        // Preserve the luxury gradient
        '--luxury-gradient': 'linear-gradient(135deg, #f8f8f8 0%, #e8e8e8 15%, #d8d8d8 30%, #c8c8c8 45%, #b8b8b8 60%, #a8a8a8 75%, #989898 90%, #888888 100%)',
        
        // Interactive states
        '--message-hover': '#253341',
        '--outgoing-hover': '#1e2d3d',
        '--image-hover': 'brightness(1.08)',
        '--follow-button-text': '#000000',
        
        // Glass effect
        '--glass-background': 'rgba(30, 39, 50, 0.9)',
        '--glass-blur': 'blur(8px)',
        '--glass-input': 'rgba(21, 32, 43, 0.8)',
        '--glass-input-focus': 'rgba(30, 39, 50, 0.95)',
        
        // Media container
        '--media-background': '#000000',
        '--media-gradient': 'rgba(21, 32, 43, 0.05) 0%, rgba(21, 32, 43, 0) 20%, rgba(21, 32, 43, 0) 80%, rgba(21, 32, 43, 0.05) 100%',
        '--post-description-bg': 'rgba(0, 0, 0, 0.8)',
        '--post-description-color': '#ffffff',
        
        // Comments
        '--comment-fade-from': 'rgba(21, 32, 43, 0)',
        '--comment-fade-to': 'rgba(21, 32, 43, 0.1)',
        
        // Interactive buttons
        '--button-hover': 'rgba(136, 153, 166, 0.1)',
        '--heart-color': '#ff3040',
        '--heart-color-hover': '#ff3040'
      },
      
      dark: {
        // Core Colors
        '--primary-color': '#a6a6a6',
        '--primary-light': '#000000',
        '--primary-dark': '#4d4d4d',
        '--text-primary': '#ffffff',
        '--text-secondary': '#8f8f8f',
        '--background-light': '#000000',
        '--background-white': '#080808',
        '--border-light': '#1a1a1a',
        '--border-color': '#121212',
        '--box-shadow': '0 2px 10px rgba(0, 0, 0, 0.4)',
        
        // Preserve the luxury gradient
        '--luxury-gradient': 'linear-gradient(135deg, #f8f8f8 0%, #e8e8e8 15%, #d8d8d8 30%, #c8c8c8 45%, #b8b8b8 60%, #a8a8a8 75%, #989898 90%, #888888 100%)',
        
        // Interactive states
        '--message-hover': '#121212',
        '--outgoing-hover': '#0a0a0a',
        '--image-hover': 'brightness(1.2)',
        '--follow-button-text': '#000000',
        
        // Glass effect
        '--glass-background': 'rgba(8, 8, 8, 0.95)',
        '--glass-blur': 'blur(8px)',
        '--glass-input': 'rgba(18, 18, 18, 0.8)',
        '--glass-input-focus': 'rgba(25, 25, 25, 0.95)',
        
        // Media container
        '--media-background': '#000000',
        '--media-gradient': 'rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0) 20%, rgba(0, 0, 0, 0) 80%, rgba(0, 0, 0, 0.1) 100%',
        '--post-description-bg': 'rgba(0, 0, 0, 0.9)',
        '--post-description-color': '#ffffff',
        
        // Comments
        '--comment-fade-from': 'rgba(0, 0, 0, 0)',
        '--comment-fade-to': 'rgba(20, 20, 20, 0.15)',
        
        // Interactive buttons
        '--button-hover': 'rgba(100, 100, 100, 0.15)',
        '--heart-color': '#ff3040',
        '--heart-color-hover': '#ff5060'
      }
    },
    
    styleElementId: 'global-chat-theme-manager-styles',
    
    initialize: function() {
      this.createStyleElement();
      this.applyCurrentTheme();
      this.setupEventListeners();
    },
    
    createStyleElement: function() {
      const existingStyle = document.getElementById(this.styleElementId);
      if (existingStyle) existingStyle.remove();
      
      const styleElement = document.createElement('style');
      styleElement.id = this.styleElementId;
      styleElement.setAttribute('data-origin', 'global-chat-theme-manager');
      document.head.appendChild(styleElement);
    },
    
    applyCurrentTheme: function() {
      const themeName = localStorage.getItem('twitter-theme') || 'light';
      this.applyTheme(themeName);
    },
    
    applyTheme: function(themeName) {
      const validThemes = ['light', 'dim', 'dark'];
      const theme = validThemes.includes(themeName) ? themeName : 'light';
      const themeVars = this.themeConfig[theme] || this.themeConfig.light;
      const styleElement = document.getElementById(this.styleElementId);
      
      if (!styleElement) {
        this.createStyleElement();
        return this.applyTheme(theme);
      }
      
      let css = ':root {\n';
      Object.entries(themeVars).forEach(([key, value]) => {
        css += `  ${key}: ${value};\n`;
      });
      css += '}\n\n';
      
      // Enhanced styles for all elements
      css += `
      /* Main Body Adjustments */
      body {
        background-color: var(--background-light);
        color: var(--text-primary);
      }
      
      /* Gallery Item */
      .gallery-item {
        background-color: var(--background-white);
        box-shadow: var(--box-shadow);
      }
      
      .gallery-item:hover img,
      .gallery-item:hover video {
        filter: var(--image-hover);
      }
      
      /* Profile Elements */
      .profile-info {
        color: var(--text-primary);
      }
      
      .profile-left span {
        color: var(--text-primary);
      }
      
      .options span {
        background-color: var(--text-secondary);
      }
      
      /* Fullscreen Modal */
      .fullscreen-modal {
        background-color: var(--background-white);
        box-shadow: -5px 0 25px rgba(0, 0, 0, 0.25);
      }
      
      .modal-header, .post-header, .comment-form {
        background-color: var(--glass-background);
        backdrop-filter: var(--glass-blur);
        border-color: var(--border-light);
      }
      
      .back-button {
        color: var(--text-primary);
      }
      
      .back-button:hover {
        background-color: var(--button-hover);
      }
      
      .modal-title {
        color: var(--text-primary);
      }
      
      /* Media Container */
      .media-container {
        background-color: var(--media-background);
      }
      
      .media-container::after {
        background: linear-gradient(to bottom, var(--media-gradient));
      }
      
      /* Post Description */
      .post-description {
        background-color: var(--post-description-bg);
        color: var(--post-description-color);
        border-color: var(--border-light);
      }
      
      /* Comments Section */
      .comments-section {
        background-color: var(--background-white);
        border-color: var(--border-light);
      }
      
      .post-user-name {
        color: var(--text-primary);
      }
      
      /* Like Button */
      .like-post-button, .like-button {
        color: var(--text-secondary);
      }
      
      .like-post-button:hover, .like-button:hover {
        color: var(--heart-color-hover);
      }
      
      .like-post-button.liked, .like-button.liked {
        color: var(--heart-color);
      }
      
      /* Follow Button */
      .follow-btn {
        border-color: var(--primary-color);
        color: var(--primary-color);
      }
      
      .follow-btn:hover {
        background-color: var(--button-hover);
      }
      
      .follow-btn.followed {
        background: var(--luxury-gradient);
        color: var(--follow-button-text);
      }
      
      /* Reply Preview */
      .reply-preview {
        background-color: var(--background-light);
        border-color: var(--border-light);
      }
      
      .reply-preview-text {
        color: var(--text-secondary);
      }
      
      .reply-preview-close {
        color: var(--text-secondary);
      }
      
      .reply-preview-close:hover {
        color: var(--text-primary);
      }
      
      /* Comments List */
      .comments-list {
        color: var(--text-primary);
      }
      
      .comment {
        animation: fadeIn 0.3s ease-in;
      }
      
      @keyframes fadeIn {
        from { 
          opacity: 0; 
          transform: translateY(8px); 
          background: var(--comment-fade-from);
        }
        to { 
          opacity: 1; 
          transform: translateY(0); 
          background: var(--comment-fade-to);
        }
      }
      
      .comment-author {
        color: var(--text-primary);
      }
      
      .comment-text {
        color: var(--text-primary);
      }
      
      .comment-time {
        color: var(--text-secondary);
      }
      
      .reply-btn {
        color: var(--text-secondary);
      }
      
      .reply-btn:hover {
        color: var(--primary-color);
      }
      
      /* Comment Form */
      .comment-input-container {
        border-color: var(--border-light);
        background-color: var(--glass-input);
      }
      
      .comment-input-container:focus-within {
        border-color: var(--primary-color);
        background-color: var(--glass-input-focus);
        box-shadow: 0 0 0 2px rgba(98, 98, 98, 0.1);
      }
      
      .comment-input {
        color: var(--text-primary);
      }
      
      .comment-input::placeholder {
        color: var(--text-secondary);
      }
      
      .gif-button {
        color: var(--text-secondary);
      }
      
      .gif-button:hover {
        background-color: var(--button-hover);
        color: var(--primary-color);
      }
      
      /* Submit Button - Keep the gradient */
      .submit-button {
        background: var(--luxury-gradient);
      }
      
      .submit-button:disabled {
        background: linear-gradient(135deg, #cccccc, #999999);
      }
      
      /* GIF Selector */
      .gif-selector {
        background-color: var(--background-white);
        border-color: var(--border-light);
        box-shadow: 0 2px 20px rgba(0,0,0,0.25);
      }
      
      .gif-search {
        border-color: var(--border-light);
        color: var(--text-primary);
        background-color: var(--background-white);
      }
      
      .gif-search:focus {
        border-color: var(--primary-color);
      }
      
      /* Scrollbar Styling */
      .gif-results::-webkit-scrollbar-track {
        background: var(--primary-light);
      }
      
      .gif-results::-webkit-scrollbar-thumb {
        background: var(--primary-color);
      }
      
      .gif-item {
        border-color: var(--border-light);
      }
      
      /* Replies */
      .replies-container {
        border-left-color: var(--border-light);
      }
      
      .view-replies-btn {
        color: var(--text-secondary);
      }
      
      .view-replies-btn:hover {
        color: var(--primary-color);
      }
      
      /* Profile Modal */
      .profile-modal {
        background: var(--background-white);
      }
      
      /* Loading Animation */
      .loading-container {
        background-color: var(--background-light);
      }
      
      /* Make sure all borders use the border color variable */
      .modal-header, .post-header, .post-description, .comment-form, .reply-preview,
      .gif-selector, .gif-item, .gif-search {
        border-color: var(--border-light);
      }
      `;
      
      styleElement.textContent = css;
      
      // Immediately adjust any media elements that need it
      setTimeout(() => {
        const mediaElements = document.querySelectorAll('.media-container img, .media-container video');
        mediaElements.forEach(el => {
          el.style.maxHeight = '100%';
        });
      }, 100);
    },
    
    setupEventListeners: function() {
      // Listen for theme changes from localStorage
      window.addEventListener('storage', (e) => {
        if (e.key === 'twitter-theme') {
          this.applyTheme(e.newValue || 'light');
        }
      });
      
      // Listen for DOM changes that might indicate new content
      const observer = new MutationObserver((mutations) => {
        let shouldRefresh = false;
        
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === 1) { // Element node
                shouldRefresh = true;
                break;
              }
            }
          }
          if (shouldRefresh) break;
        }
        
        if (shouldRefresh) {
          this.applyCurrentTheme();
        }
      });
      
      observer.observe(document.body, { 
        childList: true, 
        subtree: true 
      });
      
      this.setupPeriodicCheck();
    },
    
    setupPeriodicCheck: function() {
      let lastKnownTheme = localStorage.getItem('twitter-theme') || 'light';
      setInterval(() => {
        const currentTheme = localStorage.getItem('twitter-theme');
        if (currentTheme !== lastKnownTheme) {
          lastKnownTheme = currentTheme || 'light';
          this.applyTheme(lastKnownTheme);
        }
      }, 2000);
    }
  };
  
  function initializeThemeManager() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        GlobalChatThemeManager.initialize();
      });
    } else {
      GlobalChatThemeManager.initialize();
    }
  }
  
  // Initialize with a small delay to ensure the DOM is ready
  setTimeout(initializeThemeManager, 100);
})();