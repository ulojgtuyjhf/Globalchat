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

      .minimal-translator {
        position: fixed;
        top: 15px;
        right: 15px;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        align-items: flex-start;
        gap: 8px;
      }

      .translator-trigger {
        background: white;
        border: 1px solid rgba(0, 0, 0, 0.1);
        width: 36px;
        height: 36px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        transition: all 0.2s;
        flex-shrink: 0;
        position: relative;
        z-index: 10000;
      }

      .translator-trigger:hover {
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
      }

      .trigger-dots {
        display: flex;
        gap: 3px;
      }

      .trigger-dot {
        width: 3px;
        height: 3px;
        background: #444;
        border-radius: 50%;
      }

      .translator-menu {
        position: relative;
        background: white;
        border-radius: 8px;
        width: 200px;
        opacity: 0;
        visibility: hidden;
        transform: translateX(-10px);
        transition: all 0.2s;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
        border: 1px solid rgba(0, 0, 0, 0.1);
      }

      .translator-menu.active {
        opacity: 1;
        visibility: visible;
        transform: translateX(0);
      }

      .menu-header {
        padding: 10px;
        border-bottom: 1px solid #eee;
        font-size: 13px;
        color: #666;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .menu-header svg {
        width: 14px;
        height: 14px;
      }

      .language-list {
        max-height: 300px;
        overflow-y: auto;
      }

      .language-option {
        padding: 8px 10px;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        transition: background 0.2s;
      }

      .language-option:hover {
        background: #f5f5f5;
      }

      .language-option.active {
        background: #e9ecef;
      }

      .language-icon {
        font-size: 16px;
      }

      .language-name {
        font-size: 13px;
        color: #333;
      }

      .original-language {
        padding: 8px 10px;
        border-top: 1px solid #eee;
        font-size: 12px;
        color: #666;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .original-language:hover {
        background: #f5f5f5;
      }

      .original-language svg {
        width: 12px;
        height: 12px;
      }

      @media (max-width: 768px) {
        .minimal-translator {
          top: 10px;
          right: 10px;
        }

        .translator-menu {
          position: absolute;
          right: 0;
          top: 45px;
          width: 250px;
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
      <div class="trigger-dots">
        <div class="trigger-dot"></div>
        <div class="trigger-dot"></div>
        <div class="trigger-dot"></div>
      </div>
    `;

    const menu = document.createElement('div');
    menu.className = 'translator-menu';

    const header = document.createElement('div');
    header.className = 'menu-header';
    header.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
      Select Language
    `;

    const languageList = document.createElement('div');
    languageList.className = 'language-list';

    Object.entries(this.languages).forEach(([code, lang]) => {
      const option = document.createElement('div');
      option.className = `language-option${code === this.currentLanguage ? ' active' : ''}`;
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
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 12h18M3 6h18M3 18h18"/>
      </svg>
      Back to Original
    `;
    originalOption.onclick = () => this.resetToOriginal();

    menu.appendChild(header);
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

    this.menu = menu;
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

  changeLanguage(languageCode) {
    if (!this.translationInitialized) {
      setTimeout(() => this.changeLanguage(languageCode), 100);
      return;
    }

    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = languageCode;
      select.dispatchEvent(new Event('change'));
    }
    
    this.currentLanguage = languageCode;
    this.menu.classList.remove('active');

    this.menu.querySelectorAll('.language-option').forEach(option => {
      option.classList.toggle('active', 
        option.querySelector('.language-name').textContent === this.languages[languageCode].name);
    });

    localStorage.setItem('preferredLanguage', languageCode);

    // Force hide Google elements after translation
    setTimeout(() => {
      const googleElements = document.querySelectorAll('.VIpgJd-ZVi9od-l4eHX-hSRGPd, .goog-te-banner-frame, .goog-te-menu-frame');
      googleElements.forEach(element => {
        element.style.display = 'none';
      });
      document.body.style.top = '0px';
    }, 100);
  }

  resetToOriginal() {
    if (!this.translationInitialized) {
      setTimeout(() => this.resetToOriginal(), 100);
      return;
    }

    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = this.originalLanguage;
      select.dispatchEvent(new Event('change'));
    }

    this.currentLanguage = this.originalLanguage;
    this.menu.classList.remove('active');
    localStorage.removeItem('preferredLanguage');

    // Force hide Google elements after reset
    setTimeout(() => {
      const googleElements = document.querySelectorAll('.VIpgJd-ZVi9od-l4eHX-hSRGPd, .goog-te-banner-frame, .goog-te-menu-frame');
      googleElements.forEach(element => {
        element.style.display = 'none';
      });
      document.body.style.top = '0px';
    }, 100);
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