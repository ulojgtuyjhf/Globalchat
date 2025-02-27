class MinimalTranslator {
  constructor() {
    this.currentLanguage = 'en';
    this.originalLanguage = document.documentElement.lang || 'en';
    this.languages = {
      'en': { name: 'English', icon: '🇬🇧' },
      'es': { name: 'Español', icon: '🇪🇸' },
      'fr': { name: 'Français', icon: '🇫🇷' },
      'de': { name: 'Deutsch', icon: '🇩🇪' },
      'it': { name: 'Italiano', icon: '🇮🇹' },
      'pt': { name: 'Português', icon: '🇵🇹' },
      'ru': { name: 'Русский', icon: '🇷🇺' },
      'ja': { name: '日本語', icon: '🇯🇵' },
      'ko': { name: '한국어', icon: '🇰🇷' },
      'zh': { name: '中文', icon: '🇨🇳' },
      'ar': { name: 'العربية', icon: '🇸🇦' },
      'hi': { name: 'हिन्दी', icon: '🇮🇳' },
      'sw': { name: 'Kiswahili', icon: '🇰🇪' },
      'zu': { name: 'isiZulu', icon: '🇿🇦' },
      'xh': { name: 'isiXhosa', icon: '🇿🇦' },
      'af': { name: 'Afrikaans', icon: '🇿🇦' },
      'st': { name: 'Sesotho', icon: '🇿🇦' },
      'tn': { name: 'Setswana', icon: '🇿🇦' },
      'ts': { name: 'Xitsonga', icon: '🇿🇦' },
      've': { name: 'Tshivenda', icon: '🇿🇦' },
      'nr': { name: 'isiNdebele', icon: '🇿🇦' },
      'ms': { name: 'Bahasa Melayu', icon: '🇲🇾' },
      'vi': { name: 'Tiếng Việt', icon: '🇻🇳' },
      'th': { name: 'ภาษาไทย', icon: '🇹🇭' },
      'tr': { name: 'Türkçe', icon: '🇹🇷' },
      'pl': { name: 'Polski', icon: '🇵🇱' },
      'uk': { name: 'Українська', icon: '🇺🇦' },
      'he': { name: 'עברית', icon: '🇮🇱' },
      'fa': { name: 'فارسی', icon: '🇮🇷' },
      'bn': { name: 'বাংলা', icon: '🇧🇩' },
      'ta': { name: 'தமிழ்', icon: '🇮🇳' },
      'te': { name: 'తెలుగు', icon: '🇮🇳' },
      'ml': { name: 'മലയാളം', icon: '🇮🇳' },
      'kn': { name: 'ಕನ್ನಡ', icon: '🇮🇳' },
      'mr': { name: 'मराठी', icon: '🇮🇳' },
      'gu': { name: 'ગુજરાતી', icon: '🇮🇳' },
      'pa': { name: 'ਪੰਜਾਬੀ', icon: '🇮🇳' },
      'ur': { name: 'اردو', icon: '🇵🇰' },
      'id': { name: 'Bahasa Indonesia', icon: '🇮🇩' },
      'am': { name: 'አማርኛ', icon: '🇪🇹' },
      'ig': { name: 'Igbo', icon: '🇳🇬' },
      'yo': { name: 'Yorùbá', icon: '🇳🇬' },
      'ha': { name: 'Hausa', icon: '🇳🇬' },
      'el': { name: 'Ελληνικά', icon: '🇬🇷' },
      'cs': { name: 'Čeština', icon: '🇨🇿' },
      'hu': { name: 'Magyar', icon: '🇭🇺' },
      'ro': { name: 'Română', icon: '🇷🇴' },
      'bg': { name: 'Български', icon: '🇧🇬' },
      'sv': { name: 'Svenska', icon: '🇸🇪' },
      'no': { name: 'Norsk', icon: '🇳🇴' },
      'fi': { name: 'Suomi', icon: '🇫🇮' },
      'da': { name: 'Dansk', icon: '🇩🇰' },
      'sk': { name: 'Slovenčina', icon: '🇸🇰' },
      'sl': { name: 'Slovenščina', icon: '🇸🇮' },
      'sr': { name: 'Српски', icon: '🇷🇸' },
      'hr': { name: 'Hrvatski', icon: '🇭🇷' },
      'lt': { name: 'Lietuvių', icon: '🇱🇹' },
      'lv': { name: 'Latviešu', icon: '🇱🇻' },
      'et': { name: 'Eesti', icon: '🇪🇪' },
      'ga': { name: 'Gaeilge', icon: '🇮🇪' },
      'cy': { name: 'Cymraeg', icon: '🏴' },
      'mt': { name: 'Malti', icon: '🇲🇹' },
      'is': { name: 'Íslenska', icon: '🇮🇸' },
      'sq': { name: 'Shqip', icon: '🇦🇱' },
      'mk': { name: 'Македонски', icon: '🇲🇰' }
    };
    
    this.translationInitialized = false;
    this.isLoading = false;
    this.init();
  }

  injectStyles() {
    const styles = `
      /* Hide all Google Translate elements */
      .goog-te-banner-frame,
      .goog-te-balloon-frame,
      #goog-gt-tt,
      .goog-te-balloon-frame,
      .goog-tooltip,
      .goog-tooltip:hover,
      .goog-text-highlight,
      .VIpgJd-ZVi9od-l4eHX-hSRGPd,
      .VIpgJd-ZVi9od-ORHb-OEVmcd,
      .VIpgJd-ZVi9od-SmfZ-OEVmcd-tJHJj,
      .goog-te-gadget,
      .goog-logo-link {
        display: none !important;
      }

      .goog-te-menu-frame {
        box-shadow: none !important;
      }

      .goog-text-highlight {
        background-color: transparent !important;
        box-shadow: none !important;
      }

      body {
        top: 0 !important;
        position: static !important;
      }

      .VIpgJd-ZVi9od-aZ2wEe-wOHMyf {
        display: none !important;
      }

      .VIpgJd-ZVi9od-aZ2wEe-OiiCO {
        display: none !important;
      }

      #google_translate_element {
        display: none !important;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-10px); }
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.7; }
        100% { transform: scale(1); opacity: 1; }
      }

      .minimal-translator {
        position: fixed;
        top: 15px;
        right: 15px;
        z-index: 9999;
        font-family: "Chirp", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        display: flex;
        align-items: flex-start;
        gap: 8px;
      }

      .translator-trigger {
        background: #1DA1F2;
        border: none;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(29, 161, 242, 0.3);
        transition: all 0.2s ease;
        flex-shrink: 0;
        position: relative;
        z-index: 10000;
        color: white;
      }

      .translator-trigger:hover {
        background: #1a91da;
        box-shadow: 0 2px 10px rgba(29, 161, 242, 0.4);
        transform: scale(1.05);
      }

      .translator-trigger:active {
        transform: scale(0.95);
      }

      .translator-trigger.loading {
        animation: pulse 1.2s infinite;
      }

      .trigger-icon {
        width: 18px;
        height: 18px;
        fill: white;
      }

      .translator-menu {
        position: relative;
        background: white;
        border-radius: 16px;
        width: 240px;
        opacity: 0;
        visibility: hidden;
        transform-origin: top right;
        transform: scale(0.9);
        transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1);
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
        border: 1px solid rgba(0, 0, 0, 0.08);
        overflow: hidden;
      }

      .translator-menu.active {
        opacity: 1;
        visibility: visible;
        transform: scale(1);
      }

      .menu-header {
        padding: 14px 16px;
        border-bottom: 1px solid #eee;
        font-size: 15px;
        font-weight: 700;
        color: #333;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .menu-header-title {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .menu-header svg {
        width: 16px;
        height: 16px;
        color: #1DA1F2;
      }

      .search-box {
        padding: 8px 16px;
        position: relative;
        border-bottom: 1px solid #eee;
      }

      .search-box input {
        width: 100%;
        border: 1px solid #eee;
        border-radius: 20px;
        padding: 8px 12px 8px 32px;
        font-size: 13px;
        outline: none;
        transition: all 0.2s;
      }

      .search-box input:focus {
        border-color: #1DA1F2;
        box-shadow: 0 0 0 1px rgba(29, 161, 242, 0.3);
      }

      .search-icon {
        position: absolute;
        left: 28px;
        top: 16px;
        width: 14px;
        height: 14px;
        color: #657786;
      }

      .language-list {
        max-height: 340px;
        overflow-y: auto;
        padding: 8px 0;
      }

      .language-list::-webkit-scrollbar {
        width: 6px;
      }

      .language-list::-webkit-scrollbar-track {
        background: transparent;
      }

      .language-list::-webkit-scrollbar-thumb {
        background-color: rgba(0, 0, 0, 0.1);
        border-radius: 10px;
      }

      .language-option {
        padding: 10px 16px;
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        transition: background 0.2s;
        position: relative;
      }

      .language-option:after {
        content: "";
        position: absolute;
        width: 18px;
        height: 18px;
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
        background-color: #1DA1F2;
        border-radius: 50%;
        display: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'/%3E%3C/svg%3E");
        background-position: center;
        background-repeat: no-repeat;
        background-size: 12px;
      }

      .language-option:hover {
        background: rgba(29, 161, 242, 0.1);
      }

      .language-option.active {
        background: rgba(29, 161, 242, 0.1);
      }

      .language-option.active:after {
        display: block;
      }

      .language-icon {
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .language-name {
        font-size: 14px;
        color: #14171A;
        flex-grow: 1;
      }

      .original-language {
        padding: 12px 16px;
        border-top: 1px solid #eee;
        font-size: 14px;
        color: #1DA1F2;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .original-language:hover {
        background: rgba(29, 161, 242, 0.1);
      }

      .original-language svg {
        width: 14px;
        height: 14px;
        color: #1DA1F2;
      }

      .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.7);
        z-index: 9998;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s;
      }

      .loading-overlay.active {
        opacity: 1;
        visibility: visible;
      }

      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(29, 161, 242, 0.2);
        border-radius: 50%;
        border-top-color: #1DA1F2;
        animation: spin 1s ease-in-out infinite;
      }

      @media (max-width: 768px) {
        .minimal-translator {
          top: 10px;
          right: 10px;
        }

        .translator-menu {
          position: absolute;
          right: 0;
          top: 42px;
          width: 280px;
        }
      }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // Add mutation observer to continuously hide Google elements
    const observer = new MutationObserver((mutations) => {
      const googleElements = document.querySelectorAll('.VIpgJd-ZVi9od-l4eHX-hSRGPd, .goog-te-banner-frame, .goog-te-menu-frame');
      googleElements.forEach(element => {
        element.style.display = 'none';
      });
      document.body.style.top = '0px';
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  createTranslatorUI() {
    const container = document.createElement('div');
    container.className = 'minimal-translator';

    const trigger = document.createElement('button');
    trigger.className = 'translator-trigger';
    trigger.innerHTML = `
      <svg class="trigger-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
      </svg>
    `;

    const menu = document.createElement('div');
    menu.className = 'translator-menu';

    const header = document.createElement('div');
    header.className = 'menu-header';
    header.innerHTML = `
      <div class="menu-header-title">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" fill="none" stroke="currentColor" stroke-width="2"/>
        </svg>
        Translate
      </div>
    `;

    const searchBox = document.createElement('div');
    searchBox.className = 'search-box';
    searchBox.innerHTML = `
      <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke-width="2"/>
      </svg>
      <input type="text" placeholder="Search languages">
    `;

    const languageList = document.createElement('div');
    languageList.className = 'language-list';

    Object.entries(this.languages).forEach(([code, lang]) => {
      const option = document.createElement('div');
      option.className = `language-option${code === this.currentLanguage ? ' active' : ''}`;
      option.dataset.code = code;
      option.innerHTML = `
        <span class="language-icon">${lang.icon}</span>
        <span class="language-name">${lang.name}</span>
      `;
      option.onclick = () => this.changeLanguage(code);
      languageList.appendChild(option);
    });

    const originalOption = document.createElement('div');
    originalOption.className = 'original-language';
    originalOption.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 10h18M3 14h18M5 18l6-12M13 18l6-12"/>
      </svg>
      Original language
    `;
    originalOption.onclick = () => this.resetToOriginal();

    // Add search functionality
    const searchInput = searchBox.querySelector('input');
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const options = languageList.querySelectorAll('.language-option');
      
      options.forEach(option => {
        const languageName = option.querySelector('.language-name').textContent.toLowerCase();
        const code = option.dataset.code;
        
        if (languageName.includes(searchTerm) || code.includes(searchTerm)) {
          option.style.display = 'flex';
        } else {
          option.style.display = 'none';
        }
      });
    });

    menu.appendChild(header);
    menu.appendChild(searchBox);
    menu.appendChild(languageList);
    menu.appendChild(originalOption);

    trigger.onclick = (e) => {
      e.stopPropagation();
      menu.classList.toggle('active');
    };

    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        menu.classList.remove('active');
      }
    });

    container.appendChild(trigger);
    container.appendChild(menu);
    document.body.appendChild(container);

    // Create loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = `<div class="loading-spinner"></div>`;
    document.body.appendChild(loadingOverlay);

    this.menu = menu;
    this.trigger = trigger;
    this.loadingOverlay = loadingOverlay;
  }

  initializeTranslation() {
    if (!window.googleTranslateElementInit) {
      window.googleTranslateElementInit = () => {
        new google.translate.TranslateElement({
          pageLanguage: this.originalLanguage,
          includedLanguages: Object.keys(this.languages).join(','),
          layout: google.translate.TranslateElement.InlineLayout.NONE,
          autoDisplay: false
        }, 'google_translate_element');
        this.translationInitialized = true;
      };

      const googleElement = document.createElement('div');
      googleElement.id = 'google_translate_element';
      googleElement.style.display = 'none';
      document.body.appendChild(googleElement);
    }
  }

  showLoading() {
    this.isLoading = true;
    this.trigger.classList.add('loading');
    this.loadingOverlay.classList.add('active');
  }

  hideLoading() {
    this.isLoading = false;
    this.trigger.classList.remove('loading');
    this.loadingOverlay.classList.remove('active');
  }

  changeLanguage(languageCode) {
    if (!this.translationInitialized) {
      setTimeout(() => this.changeLanguage(languageCode), 100);
      return;
    }

    if (this.isLoading) return;
    
    this.showLoading();
    
    setTimeout(() => {
      const select = document.querySelector('.goog-te-combo');
      if (select) {
        select.value = languageCode;
        select.dispatchEvent(new Event('change'));
      }
      
      this.currentLanguage = languageCode;
      this.menu.classList.remove('active');

      this.menu.querySelectorAll('.language-option').forEach(option => {
        option.classList.toggle('active', option.dataset.code === languageCode);
      });

      localStorage.setItem('preferredLanguage', languageCode);

      // Hide loading after a bit to ensure translation is done
      setTimeout(() => {
        this.hideLoading();
        
        // Force hide Google elements after translation
        const googleElements = document.querySelectorAll('.VIpgJd-ZVi9od-l4eHX-hSRGPd, .goog-te-banner-frame, .goog-te-menu-frame');
        googleElements.forEach(element => {
          element.style.display = 'none';
        });
        document.body.style.top = '0px';
      }, 1000);
    }, 300);
  }

  resetToOriginal() {
    if (!this.translationInitialized) {
      setTimeout(() => this.resetToOriginal(), 100);
      return;
    }

    if (this.isLoading) return;
    
    this.showLoading();
    
    setTimeout(() => {
      // Find the iframe and restore original content
      const iframe = document.querySelector('iframe.goog-te-menu-frame');
      if (iframe) {
        const restoreElement = iframe.contentDocument.querySelector('a.goog-te-menu2-item[id*="restore"]');
        if (restoreElement) {
          restoreElement.click();
        }
      }

      this.currentLanguage = this.originalLanguage;
      this.menu.classList.remove('active');
      localStorage.removeItem('preferredLanguage');

      this.menu.querySelectorAll('.language-option').forEach(option => {
        option.classList.toggle('active', option.dataset.code === this.originalLanguage);
      });

      // Hide loading after a bit to ensure translation is done
      setTimeout(() => {
        this.hideLoading();
        
        // Force hide Google elements after reset
        const googleElements = document.querySelectorAll('.VIpgJd-ZVi9od-l4eHX-hSRGPd, .goog-te-banner-frame, .goog-te-menu-frame');
        googleElements.forEach(element => {
          element.style.display = 'none';
        });
        document.body.style.top = '0px';
      }, 1000);
    }, 300);
  }

  init() {
    this.injectStyles();
    this.createTranslatorUI();
    this.initializeTranslation();

    // Load Google Translate script
    const script = document.createElement('script');
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.head.appendChild(script);

    // Load saved language preference
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage && savedLanguage !== this.originalLanguage) {
      const checkInterval = setInterval(() => {
        if (this.translationInitialized) {
          this.changeLanguage(savedLanguage);
          clearInterval(checkInterval);
        }
      }, 100);
    }
  }
}

// Initialize translator when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new MinimalTranslator();
});
