// Initialize settings from localStorage or set defaults
const initializeSettings = () => {
  const defaultSettings = {
    privacy: {
      profileVisibility: true,
      searchPrivacy: true,
      onlineStatus: true,
      activityStatus: false
    },
    security: {
      twoFactorAuth: false,
      loginVerification: true,
      encryption: true,
      deviceManagement: true
    }
  };

  // Try to get settings from localStorage or use defaults
  const savedSettings = localStorage.getItem('modalSettings');
  return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
};

// Save settings to localStorage
const saveSettings = (settings) => {
  localStorage.setItem('modalSettings', JSON.stringify(settings));
};

// Update UI based on saved settings
const updateSettingsUI = () => {
  const settings = initializeSettings();
  
  // Update privacy settings
  document.querySelectorAll('.settings-section').forEach(section => {
    const sectionType = section.querySelector('h3').textContent.toLowerCase().includes('privacy') ? 'privacy' : 'security';
    
    section.querySelectorAll('.settings-item').forEach(item => {
      const toggle = item.querySelector('.toggle-switch');
      if (toggle) {
        const settingKey = item.querySelector('.settings-item-text').textContent
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '');
        
        // Set toggle state based on saved settings
        if (settings[sectionType][settingKey] !== undefined) {
          toggle.classList.toggle('active', settings[sectionType][settingKey]);
        }
        
        // Add event listener to save changes
        toggle.addEventListener('click', () => {
          const isActive = toggle.classList.contains('active');
          settings[sectionType][settingKey] = isActive;
          saveSettings(settings);
        });
      }
    });
  });
};

// Event listener for page load
document.addEventListener('DOMContentLoaded', () => {
  // Initialize settings and update UI when modal is opened
  ['privacyBtn', 'securityBtn'].forEach(btnId => {
    document.getElementById(btnId)?.addEventListener('click', () => {
      setTimeout(updateSettingsUI, 100); // Short delay to ensure modal content is loaded
    });
  });
});