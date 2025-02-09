// Add required Font Awesome styles if not already present
const fontAwesomeCDN = document.createElement('link');
fontAwesomeCDN.rel = 'stylesheet';
fontAwesomeCDN.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css';
document.head.appendChild(fontAwesomeCDN);

// Create and append modal styles
const modalStyles = document.createElement('style');
modalStyles.textContent = `
  .settings-modal {
    position: fixed;
    top: 0;
    right: -100%;
    width: 100%;
    max-width: 500px;
    height: 100vh;
    background: var(--primary-light, #ffffff);
    box-shadow: -5px 0 15px rgba(0,0,0,0.1);
    transition: right 0.3s ease-in-out;
    z-index: 1000;
    overflow-y: auto;
  }

  .settings-modal.active {
    right: 0;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease-in-out;
    z-index: 999;
  }

  .modal-overlay.active {
    opacity: 1;
    visibility: visible;
  }

  .settings-modal-header {
    display: flex;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid var(--border-color, #eee);
    background: var(--primary-light, #ffffff);
  }

  .settings-modal-back {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: var(--text-color, #333);
    margin-right: 15px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.3s;
  }

  .settings-modal-back:hover {
    background-color: var(--hover-color, #f5f5f5);
  }

  .settings-modal-title {
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--text-color, #333);
    flex-grow: 1;
  }

  .settings-modal-content {
    padding: 20px;
  }

  .settings-section {
    margin-bottom: 25px;
  }

  .settings-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 15px;
    border-radius: 10px;
    background: var(--item-bg, #f8f9fa);
    margin-bottom: 15px;
    transition: all 0.3s ease;
  }

  .settings-item:hover {
    background: var(--item-hover-bg, #f0f1f2);
  }

  .settings-item-left {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .settings-item-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--icon-bg, #e9ecef);
    color: var(--icon-color, #2c2c2c);
  }

  .settings-item-text {
    font-size: 0.95rem;
    color: var(--text-color, #333);
  }

  .settings-item-description {
    font-size: 0.85rem;
    color: var(--description-color, #666);
    margin-top: 4px;
  }

  .toggle-switch {
    position: relative;
    width: 50px;
    height: 26px;
    border-radius: 13px;
    background: #ccc;
    cursor: pointer;
    transition: background 0.3s;
  }

  .toggle-switch.active {
    background: var(--accent-color, #2c2c2c);
  }

  .toggle-switch::before {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    transition: transform 0.3s;
  }

  .toggle-switch.active::before {
    transform: translateX(24px);
  }

  .dark-mode .settings-modal {
    background: var(--primary-dark, #1b1b2f);
    color: var(--text-dark, #f3f3f3);
  }

  .dark-mode .settings-modal-header {
    background: var(--primary-dark, #1b1b2f);
    border-bottom-color: var(--border-dark, #333);
  }

  .dark-mode .settings-modal-back {
    color: var(--text-dark, #f3f3f3);
  }

  .dark-mode .settings-modal-back:hover {
    background-color: var(--hover-dark, #2a2a3a);
  }

  .dark-mode .settings-item {
    background: var(--item-bg-dark, #232334);
  }

  .dark-mode .settings-item:hover {
    background: var(--item-hover-bg-dark, #2a2a3a);
  }

  .dark-mode .settings-item-icon {
    background: var(--icon-bg-dark, #333344);
  }

  .dark-mode .settings-item-text {
    color: var(--text-dark, #f3f3f3);
  }

  .dark-mode .settings-item-description {
    color: var(--description-dark, #aaa);
  }
`;

document.head.appendChild(modalStyles);

// Create modal container
const modalContainer = document.createElement('div');
modalContainer.innerHTML = `
  <div class="modal-overlay"></div>
  <div class="settings-modal">
    <div class="settings-modal-header">
      <button class="settings-modal-back">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h2 class="settings-modal-title"></h2>
    </div>
    <div class="settings-modal-content"></div>
  </div>
`;
document.body.appendChild(modalContainer);

// Get modal elements
const settingsModal = document.querySelector('.settings-modal');
const modalOverlay = document.querySelector('.modal-overlay');
const modalBack = document.querySelector('.settings-modal-back');
const modalTitle = document.querySelector('.settings-modal-title');
const modalContent = document.querySelector('.settings-modal-content');

// Modal content configurations
const modalContents = {
  privacy: {
    title: 'Privacy Settings',
    sections: [
      {
        title: 'Profile Privacy',
        items: [
          {
            icon: 'fa-user-shield',
            text: 'Profile Visibility',
            description: 'Control who can see your profile',
            type: 'toggle',
            default: true
          },
          {
            icon: 'fa-search',
            text: 'Search Privacy',
            description: 'Allow others to find you by email or phone',
            type: 'toggle',
            default: true
          }
        ]
      },
      {
        title: 'Activity Privacy',
        items: [
          {
            icon: 'fa-clock',
            text: 'Online Status',
            description: 'Show when you\'re active',
            type: 'toggle',
            default: true
          },
          {
            icon: 'fa-history',
            text: 'Activity Status',
            description: 'Share your activity status with others',
            type: 'toggle',
            default: false
          }
        ]
      }
    ]
  },
  security: {
    title: 'Security Settings',
    sections: [
      {
        title: 'Account Security',
        items: [
          {
            icon: 'fa-shield-alt',
            text: 'Two-Factor Authentication',
            description: 'Add an extra layer of security',
            type: 'toggle',
            default: false
          },
          {
            icon: 'fa-key',
            text: 'Login Verification',
            description: 'Verify new device logins',
            type: 'toggle',
            default: true
          }
        ]
      },
      {
        title: 'Data Security',
        items: [
          {
            icon: 'fa-lock',
            text: 'End-to-End Encryption',
            description: 'Encrypt your messages and media',
            type: 'toggle',
            default: true
          },
          {
            icon: 'fa-mobile-alt',
            text: 'Device Management',
            description: 'Manage connected devices',
            type: 'toggle',
            default: true
          }
        ]
      }
    ]
  }
};

// Function to create toggle switch
function createToggleSwitch(isActive = false) {
  const toggle = document.createElement('div');
  toggle.className = `toggle-switch${isActive ? ' active' : ''}`;
  return toggle;
}

// Function to create settings item
function createSettingsItem(item) {
  const div = document.createElement('div');
  div.className = 'settings-item';
  
  const left = document.createElement('div');
  left.className = 'settings-item-left';
  
  const icon = document.createElement('div');
  icon.className = 'settings-item-icon';
  icon.innerHTML = `<i class="fas ${item.icon}"></i>`;
  
  const text = document.createElement('div');
  text.className = 'settings-item-text';
  text.innerHTML = `
    ${item.text}
    <div class="settings-item-description">${item.description}</div>
  `;
  
  left.appendChild(icon);
  left.appendChild(text);
  div.appendChild(left);
  
  if (item.type === 'toggle') {
    const toggle = createToggleSwitch(item.default);
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      // Here you would typically update the setting in your backend
      console.log(`${item.text} toggled:`, toggle.classList.contains('active'));
    });
    div.appendChild(toggle);
  }
  
  return div;
}

// Function to open modal
function openModal(type) {
  const content = modalContents[type];
  if (content) {
    modalTitle.textContent = content.title;
    modalContent.innerHTML = '';
    
    content.sections.forEach(section => {
      const sectionDiv = document.createElement('div');
      sectionDiv.className = 'settings-section';
      
      const title = document.createElement('h3');
      title.textContent = section.title;
      title.style.marginBottom = '15px';
      sectionDiv.appendChild(title);
      
      section.items.forEach(item => {
        sectionDiv.appendChild(createSettingsItem(item));
      });
      
      modalContent.appendChild(sectionDiv);
    });
    
    settingsModal.classList.add('active');
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

// Function to close modal
function closeModal() {
  settingsModal.classList.remove('active');
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

// Event listeners
modalBack.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);

// Add click handlers to menu items
document.getElementById('privacyBtn').addEventListener('click', () => openModal('privacy'));
document.getElementById('securityBtn').addEventListener('click', () => openModal('security'));

// Handle dark mode
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.target.classList.contains('dark-mode')) {
      settingsModal.parentElement.classList.add('dark-mode');
    } else {
      settingsModal.parentElement.classList.remove('dark-mode');
    }
  });
});

observer.observe(document.body, {
  attributes: true,
  attributeFilter: ['class']
});