(function() {
  // Global Reply Section Theme Manager - Force Apply (Preserving Blue)
  const ReplyThemeManager = {
    themeConfig: {
      light: {
        '--reply-bg': '#ffffff',
        '--reply-border': '#e0e7ff',
        '--reply-text': '#333',
        '--reply-placeholder': '#666',
        '--reply-box-shadow': '0 -2px 10px rgba(0, 0, 0, 0.05)'
      },
      dim: {
        '--reply-bg': '#192734',
        '--reply-border': '#38444d',
        '--reply-text': '#f1f1f1',
        '--reply-placeholder': '#8899a6',
        '--reply-box-shadow': '0 -2px 10px rgba(0, 0, 0, 0.2)'
      },
      dark: {
        '--reply-bg': '#16181c',
        '--reply-border': '#2f3336',
        '--reply-text': '#ffffff',
        '--reply-placeholder': '#8899a6',
        '--reply-box-shadow': '0 -2px 10px rgba(0, 0, 0, 0.3)'
      }
    },
    
    styleElementId: 'reply-theme-manager-styles',
    
    initialize: function() {
      this.forceRemoveExistingStyles();
      this.createStyleElement();
      this.applyCurrentTheme();
      this.setupEventListeners();
      console.log('Reply Section Theme Manager initialized (Preserving Blue)');
    },
    
    forceRemoveExistingStyles: function() {
      document.querySelectorAll(`[data-origin="reply-theme-manager"]`).forEach(el => el.remove());
    },
    
    createStyleElement: function() {
      const styleElement = document.createElement('style');
      styleElement.id = this.styleElementId;
      styleElement.setAttribute('data-origin', 'reply-theme-manager');
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
        css += ` ${key}: ${value} !important;\n`;
      });
      css += '}\n\n';
      
      css += `
      /* Force Apply Reply Section Theme (Without Changing Blue) */
      .reply-section {
        background-color: var(--reply-bg) !important;
        border-top: 1px solid var(--reply-border) !important;
        box-shadow: var(--reply-box-shadow) !important;
      }

      

      .reply-input::placeholder {
        color: var(--reply-placeholder) !important;
      }

      .reply-message {
        background-color: var(--reply-bg) !important;
        color: var(--reply-text) !important;
        border-bottom: 1px solid var(--reply-border) !important;
      }

      /* Keep Blue Elements Untouched */
      .reply-button, .reply-send-btn, .follow-btn, .action-button:hover, .media-button, .like-btn.liked {
        color: #4a90e2 !important;
        background-color: transparent !important;
        border-color: #4a90e2 !important;
      }

      .reply-button:hover, .reply-send-btn:hover, .follow-btn.followed {
        background-color: rgba(74, 144, 226, 0.1) !important;
      }
      `;
      
      styleElement.textContent = css;
      console.log('Reply Section Theme Manager: Applied theme (Preserving Blue)', theme);
    },
    
    setupEventListeners: function() {
      window.addEventListener('storage', (e) => {
        if (e.key === 'twitter-theme') {
          this.applyTheme(e.newValue || 'light');
        }
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
  
  function initializeReplyThemeManager() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        ReplyThemeManager.initialize();
      });
    } else {
      ReplyThemeManager.initialize();
    }
  }
  
  setTimeout(initializeReplyThemeManager, 50);
})();